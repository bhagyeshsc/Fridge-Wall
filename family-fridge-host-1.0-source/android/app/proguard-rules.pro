# Debug builds do not minify, so none of this runs today. It is here because
# the release block references this file, and because the day someone turns
# minification on is not the day they want to discover what Ktor needs.

# Ktor and its engines resolve plenty by reflection and service loaders.
-keep class io.ktor.** { *; }
-keepclassmembers class io.ktor.** { *; }
-dontwarn io.ktor.**

# Coroutines' internal service loader entries.
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-dontwarn kotlinx.coroutines.**

# Ktor pulls these in transitively on the JVM but never uses them on Android.
-dontwarn org.slf4j.**
-dontwarn java.lang.management.**
