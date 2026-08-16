package com.familyfridge.host

import io.ktor.websocket.Frame
import io.ktor.websocket.WebSocketSession
import io.ktor.websocket.send
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/*
 * Who is listening, and pushing to them when something actually changes.
 *
 * Nothing here polls and nothing here ticks. A connected device costs a
 * suspended coroutine and an open socket until somebody writes, which is
 * what makes an idle wall cost roughly nothing on a phone that is supposed
 * to sit on a charger for months.
 *
 * Members carry a client id rather than being identified by their socket,
 * because the write that triggers a broadcast arrives over HTTP and has no
 * socket of its own to compare against. Without it the writer receives an
 * echo of its own change, which would revert any edit made in the moment
 * between saving and the echo landing.
 */
class Hub {

    private data class Member(val clientId: String, val session: WebSocketSession)

    private val rooms = HashMap<String, MutableSet<Member>>()
    private val lock = Any()

    private val _clients = MutableStateFlow(0)
    val clients: StateFlow<Int> = _clients

    fun join(wallId: String, clientId: String, session: WebSocketSession) {
        synchronized(lock) {
            rooms.getOrPut(wallId) { LinkedHashSet() }.add(Member(clientId, session))
            recount()
        }
    }

    fun leave(wallId: String, session: WebSocketSession) {
        synchronized(lock) {
            rooms[wallId]?.removeAll { it.session === session }
            if (rooms[wallId]?.isEmpty() == true) rooms.remove(wallId)
            recount()
        }
    }

    /** Everyone on this wall except whoever caused the change. */
    suspend fun broadcast(wallId: String, payload: String, except: String?) {
        val targets = synchronized(lock) { rooms[wallId]?.toList().orEmpty() }
        for (member in targets) {
            if (member.clientId == except) continue
            try {
                member.session.send(Frame.Text(payload))
            } catch (e: Exception) {
                // Died between the snapshot above and now. Its own close
                // handler takes it out of the room, so there is nothing to do.
            }
        }
    }

    private fun recount() {
        _clients.value = rooms.values.sumOf { it.size }
    }
}
