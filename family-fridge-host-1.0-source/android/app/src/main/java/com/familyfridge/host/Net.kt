package com.familyfridge.host

import java.net.Inet4Address
import java.net.NetworkInterface

/**
 * The address worth handing out.
 *
 * Wifi interfaces sort first, because the whole point is a family on the
 * same home network. Returns null when nothing is up, which the UI shows as
 * "not on wifi" rather than a dead link nobody can reach.
 */
fun lanAddress(): String? =
    runCatching {
        NetworkInterface.getNetworkInterfaces()
            .toList()
            .filter { it.isUp && !it.isLoopback }
            .sortedBy { if (it.name.startsWith("wlan")) 0 else 1 }
            .flatMap { it.inetAddresses.toList() }
            .filterIsInstance<Inet4Address>()
            .firstOrNull { !it.isLoopbackAddress && !it.isLinkLocalAddress }
            ?.hostAddress
    }.getOrNull()
