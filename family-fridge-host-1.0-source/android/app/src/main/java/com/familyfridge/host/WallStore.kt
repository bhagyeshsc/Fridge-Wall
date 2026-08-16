package com.familyfridge.host

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import androidx.core.content.contentValuesOf
import java.util.UUID

/*
 * The whole database.
 *
 * One table, four columns, keyed by wall id. The host deliberately knows
 * nothing about tasks, groceries or people: to it a wall is an opaque JSON
 * string that arrived over the wire. That is why there is no schema here to
 * migrate when the client's shape changes, and why this file will not need
 * touching again when the wall grows a new zone.
 *
 * SQLiteOpenHelper rather than Room, because there are exactly two queries
 * and Room would buy annotation processing and build time for nothing. What
 * SQLite does buy over a flat file is an atomic write when the phone loses
 * power halfway through a save.
 */
class WallStore(context: Context) : SQLiteOpenHelper(context, DB_NAME, null, 1) {

    data class Snapshot(val state: String, val rev: Long)

    private val prefs = context.getSharedPreferences("fridge-host", Context.MODE_PRIVATE)

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE wall (
              id         TEXT PRIMARY KEY,
              state      TEXT NOT NULL,
              rev        INTEGER NOT NULL,
              updated_at INTEGER NOT NULL
            )
            """.trimIndent(),
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

    /**
     * This household's wall. Minted once on first run and stable for the life
     * of the install, which is what makes the invite link worth writing down.
     */
    fun wallId(): String =
        prefs.getString(KEY_WALL_ID, null)
            ?: UUID.randomUUID().toString().also { prefs.edit().putString(KEY_WALL_ID, it).apply() }

    fun get(id: String): Snapshot? =
        readableDatabase
            .query("wall", arrayOf("state", "rev"), "id = ?", arrayOf(id), null, null, null)
            .use { c -> if (c.moveToFirst()) Snapshot(c.getString(0), c.getLong(1)) else null }

    /**
     * Returns the new revision, or null when [expectedRev] is stale.
     *
     * The null case is the entire reason this host exists. A device that has
     * been asleep holds an old wall; without the check its debounced save
     * would write that old wall straight over everyone else's newer one.
     *
     * Safe without a transaction only because every call arrives on the
     * single-threaded writer dispatcher in [FridgeServer].
     */
    fun save(id: String, state: String, expectedRev: Long): Long? {
        val current = get(id)
        if (current != null && current.rev != expectedRev) return null

        val next = (current?.rev ?: 0L) + 1
        writableDatabase.insertWithOnConflict(
            "wall",
            null,
            contentValuesOf(
                "id" to id,
                "state" to state,
                "rev" to next,
                "updated_at" to System.currentTimeMillis(),
            ),
            SQLiteDatabase.CONFLICT_REPLACE,
        )
        return next
    }

    private companion object {
        const val DB_NAME = "fridge.db"
        const val KEY_WALL_ID = "wall-id"
    }
}
