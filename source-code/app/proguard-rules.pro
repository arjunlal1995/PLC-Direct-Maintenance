# Keep Android components and USB serial driver reflection/service metadata.
-keep class com.plc.directmaintenance.** extends android.app.Activity { *; }
-keep class com.plc.directmaintenance.** extends android.app.Service { *; }
-keep class com.hoho.android.usbserial.** { *; }
