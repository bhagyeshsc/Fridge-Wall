package com.familyfridge.host

import android.content.Context
import android.util.Log
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.install
import io.ktor.server.cio.CIO
import io.ktor.server.engine.EmbeddedServer
import io.ktor.server.engine.embeddedServer
import io.ktor.server.request.receiveText
import io.ktor.server.response.respond
import io.ktor.server.response.respondBytes
import io.ktor.server.response.respondRedirect
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.put
import io.ktor.server.routing.routing
import io.ktor.server.websocket.WebSockets
import io.ktor.server.websocket.webSocket
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.withContext
import java.io.IOException
import java.util.concurrent.Executors

const val TAG = "FamilyFridge"
const val DEFAULT_PORT = 8080

/*
 * The host.
 *
 * Three operations and a fallback. The wall arrives as an opaque string,
 * gets a revision stamped on it, and goes out to whoever else is listening.
 * Nothing here parses or understands the household: the PUT body *is* the
 * wall, which is why the server needs no JSON library at all.
 */
class FridgeServer(
    private val context: Context,
    private val store: WallStore,
    private val hub: Hub,
    private val port: Int = DEFAULT_PORT,
) {

    private var engine: EmbeddedServer<*, *>? = null

    // Every write lands here. That is what makes the read-check-write inside
    // WallStore.save safe without a transaction or an explicit lock.
    private val writer: CoroutineDispatcher =
        Executors.newSingleThreadExecutor { r -> Thread(r, "fridge-writer") }.asCoroutineDispatcher()

    val wallId: String get() = store.wallId()

    fun start() {
        if (engine != null) return
        val wall = store.wallId()

        engine = embeddedServer(CIO, port = port, host = "0.0.0.0") {
            install(WebSockets) {
                // Long enough to be free when idle, short enough to notice a
                // laptop that closed its lid without saying goodbye.
                pingPeriodMillis = 45_000
                timeoutMillis = 90_000
            }

            routing {
                get("/api/health") {
                    val rev = store.get(wall)?.rev ?: 0L
                    call.respondText(
                        """{"ok":true,"wallId":"$wall","rev":$rev}""",
                        ContentType.Application.Json,
                    )
                }

                get("/api/wall/{id}") {
                    val id = call.parameters["id"].orEmpty()
                    val snapshot = store.get(id)
                    if (snapshot == null) {
                        // A wall nobody has written yet. The client reads this
                        // as "brand new household" and shows onboarding.
                        call.respond(HttpStatusCode.NotFound)
                    } else {
                        call.respondText(snapshotJson(snapshot), ContentType.Application.Json)
                    }
                }

                put("/api/wall/{id}") {
                    val id = call.parameters["id"].orEmpty()
                    val expected = call.request.headers["If-Match"]?.toLongOrNull() ?: 0L
                    val client = call.request.headers["X-Fridge-Client"]
                    val body = call.receiveText()

                    val rev = withContext(writer) { store.save(id, body, expected) }

                    if (rev == null) {
                        // Refused. Hand back what we actually hold so the
                        // client can merge against it rather than guess.
                        val current = store.get(id)
                        if (current == null) {
                            call.respond(HttpStatusCode.NotFound)
                        } else {
                            call.respondText(
                                snapshotJson(current),
                                ContentType.Application.Json,
                                HttpStatusCode.Conflict,
                            )
                        }
                        return@put
                    }

                    call.respondText("""{"rev":$rev}""", ContentType.Application.Json)
                    // Everyone but the author, who already has this.
                    hub.broadcast(id, """{"state":$body,"rev":$rev}""", except = client)
                }

                webSocket("/feed/{id}") {
                    val id = call.parameters["id"] ?: return@webSocket
                    val client = call.request.queryParameters["client"].orEmpty()
                    hub.join(id, client, this)
                    try {
                        // Nothing is expected from the client. This parks the
                        // coroutine until the socket closes.
                        for (frame in incoming) Unit
                    } finally {
                        hub.leave(id, this)
                    }
                }

                get("/") {
                    // This phone owns one household, so the bare address is
                    // that household. Left alone the browser would mint a
                    // fresh empty wall here instead.
                    call.respondRedirect("/w/$wall")
                }

                get("/{path...}") {
                    serveAsset(call, call.parameters.getAll("path")?.joinToString("/").orEmpty())
                }
            }
        }

        engine?.start(wait = false)
        Log.i(TAG, "serving wall $wall on port $port")
    }

    fun stop() {
        engine?.stop(gracePeriodMillis = 500, timeoutMillis = 2000)
        engine = null
        Log.i(TAG, "stopped")
    }

    private fun snapshotJson(snapshot: WallStore.Snapshot): String =
        """{"state":${snapshot.state},"rev":${snapshot.rev}}"""

    private suspend fun serveAsset(call: ApplicationCall, rawPath: String) {
        val path = rawPath.trim('/').ifEmpty { "index.html" }
        val bytes = readAsset("web/$path")

        if (bytes == null) {
            // Anything unrecognised is a client-side route such as
            // /w/<uuid>, so it gets the app shell. Without this every deep
            // link and every reload away from the root would 404.
            val shell = readAsset("web/index.html")
            if (shell == null) {
                call.respond(HttpStatusCode.NotFound)
            } else {
                call.response.headers.append(HttpHeaders.CacheControl, "no-cache")
                call.respondBytes(shell, ContentType.Text.Html)
            }
            return
        }

        // Vite content-hashes everything under /assets, so those are safe to
        // cache hard. index.html never is, or a reinstalled APK would keep
        // serving the previous build's shell.
        call.response.headers.append(
            HttpHeaders.CacheControl,
            if (path.startsWith("assets/")) "public, max-age=31536000, immutable" else "no-cache",
        )
        call.respondBytes(bytes, contentTypeFor(path))
    }

    private fun readAsset(path: String): ByteArray? =
        try {
            context.assets.open(path).use { it.readBytes() }
        } catch (e: IOException) {
            null
        }

    private fun contentTypeFor(path: String): ContentType =
        when (path.substringAfterLast('.', "")) {
            "html" -> ContentType.Text.Html
            "js" -> ContentType.parse("text/javascript")
            "css" -> ContentType.Text.CSS
            "json" -> ContentType.Application.Json
            "webmanifest" -> ContentType.parse("application/manifest+json")
            "svg" -> ContentType.Image.SVG
            "png" -> ContentType.Image.PNG
            "woff2" -> ContentType.parse("font/woff2")
            "woff" -> ContentType.parse("font/woff")
            "ico" -> ContentType.parse("image/x-icon")
            else -> ContentType.Application.OctetStream
        }
}
