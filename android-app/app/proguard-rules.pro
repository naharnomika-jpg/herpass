# Herpass ProGuard Rules
# Add project specific ProGuard rules here.

# Keep WebView JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep all classes in the Herpass package
-keep class com.herpass.hostel.** { *; }

# Keep AppCompat/AndroidX
-keep class androidx.** { *; }
-dontwarn androidx.**
