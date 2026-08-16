# Family Fridge Host

Your fridge, running on a phone in your own house. No account, no cloud, no internet needed.

## What it is

Family Fridge normally keeps your wall on a server somewhere else. This is the same wall, served by an old Android phone sitting on a charger in your kitchen.

Everyone opens a web address on your home wifi and gets the fridge they already know. The phone holds the data. Nothing leaves the house.

## What you need

An Android phone running Android 8 or newer. It does not need to be a good one. A spare that has been in a drawer for four years is exactly the intended device.

Somewhere to plug it in, and your home wifi.

## Installing it

Download `family-fridge-host-1.0.apk` and open it on the phone. Android will ask whether you trust apps from wherever you got it. Say yes, once.

Open the app and tap **Start**.

You get an address like `http://192.168.1.24:8080/w/3f2a...` and a QR code of the same thing.

Two prompts show up the first time. One asks to show notifications, which you want, because that notification is how you know the fridge is still running. The other is battery settings. Find Family Fridge Host in the list and tell Android not to optimise it. Skip that step and your phone will quietly kill the fridge after a few hours.

## Using it

Scan the QR code with any phone, tablet or laptop on the same wifi. Or type the address by hand.

That is it. Same wall, same zones, same **+** button.

Bookmark it. On Android you can add it to your home screen and it opens like an app.

Leave the host phone on the charger. The notification shows the address and how many devices are connected right now.

## What changes for your family

Three things get better.

Your data sits on your own hardware. Nobody else is holding your shopping list.

It works with the internet down. As long as your router is on, the fridge is on.

Two people editing at once no longer lose work. The phone is the referee now. If your partner adds bread while you add milk, you both end up with both. The hosted version kept whichever save landed second and threw the other one away.

One thing gets worse. Anyone off your wifi cannot reach it, so the fridge stops working when you are out of the house. That is the trade you are making.

## Before you forget

Your fridge now lives on one phone. If that phone dies, the wall dies with it.

There are no automatic backups yet. Until there are, the honest advice is this. Do not put anything on there you would be upset to lose.

## How it works

Small enough to explain in a paragraph.

The phone runs a small web server as a foreground service. It serves the Family Fridge app itself straight out of the APK, so there is no second thing to deploy and the app can never drift out of step with the server behind it.

The wall is one JSON blob with a revision number on it. Three operations, and that is the whole thing.

```
GET  /api/wall/:id     read the wall
PUT  /api/wall/:id     write it back, with If-Match: <revision>
WS   /feed/:id         a socket that stays quiet until something changes
```

The revision is the interesting part. Every accepted write bumps it by one. Your browser sends back the revision it last saw, and if the phone has moved on since, it refuses the write and hands back what it actually holds. Your browser folds the two versions together and tries again. That is why nothing gets clobbered any more.

Nothing polls and nothing ticks. A connected device costs one open socket and nothing else until somebody writes something, which is why a six year old phone can do this all month without getting warm.

## Building it yourself

You need JDK 17, Node, and the Android SDK with platform 35.

Point Gradle at your SDK first, either by exporting `ANDROID_HOME` or by writing a one line `android/local.properties` that says `sdk.dir=/path/to/your/sdk`. Then install the web dependencies, because the Android build shells out to Vite.

```bash
npm install
cd android
./gradlew assembleDebug
```

The build runs the web build first and copies the result into the APK, so you cannot accidentally ship yesterday's client against today's server. The finished file lands in `app/build/outputs/apk/debug/`.

The Android project deliberately sits inside the web project rather than beside it. Gradle reaches up one level to build the client, so moving the `android` folder somewhere else on its own will not work.

## When it stops working

**The address stopped working.** Your router probably handed the phone a different one. Open the app and read the new address. Set up a DHCP reservation on your router and it will not happen again.

**It worked yesterday, now nothing loads.** Check the notification is still showing. If it has gone, Android killed the service. Go to battery settings, find the app, turn optimisation off. Samsung, Xiaomi and Oppo are the usual culprits, and they sometimes hide a second setting somewhere else entirely.

**Everything crawls when the phone's screen is off.** That should not happen. The app holds a wifi lock for exactly this reason, so if you see it, it is worth reporting along with the model of phone.

## What it does not do yet

No automatic backups. This is the one that matters.

No start on boot, so a power cut means walking over and opening the app again.

You have to type an address or scan a code, because there is no network discovery yet.

No HTTPS, which is why it will not install as a proper offline app the way the hosted version does. Over your own wifi that costs you very little.

Anyone on your wifi who has the link is in, same as the hosted version. That is the model rather than an oversight.
