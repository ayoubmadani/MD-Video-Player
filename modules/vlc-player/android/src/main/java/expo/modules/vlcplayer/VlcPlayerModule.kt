package expo.modules.vlcplayer

import android.media.MediaMetadataRetriever
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VlcPlayerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VlcPlayer")

    // Display size of a video file (rotation metadata applied), or null when unreadable.
    // Used to pick portrait vs landscape before/while playing, independent of the engine.
    AsyncFunction("getVideoSize") { uri: String ->
      val retriever = MediaMetadataRetriever()
      try {
        val parsed = Uri.parse(uri)
        if (parsed.scheme == "file") {
          retriever.setDataSource(parsed.path)
        } else {
          val ctx = appContext.reactContext ?: return@AsyncFunction null
          retriever.setDataSource(ctx, parsed)
        }
        val w = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull() ?: 0
        val h = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull() ?: 0
        val rot = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull() ?: 0
        if (w <= 0 || h <= 0) return@AsyncFunction null
        val swap = rot == 90 || rot == 270
        mapOf("width" to if (swap) h else w, "height" to if (swap) w else h)
      } catch (_: Exception) {
        null
      } finally {
        try {
          retriever.release()
        } catch (_: Exception) {
        }
      }
    }

    View(VlcPlayerView::class) {
      Events("onDuration", "onProgress", "onPlaying", "onPaused", "onEnd", "onError")

      AsyncFunction("loadSource") { view: VlcPlayerView, uri: String, startPosition: Double ->
        view.loadSource(uri, startPosition)
      }

      AsyncFunction("play") { view: VlcPlayerView ->
        view.play()
      }

      AsyncFunction("pause") { view: VlcPlayerView ->
        view.pause()
      }

      AsyncFunction("seek") { view: VlcPlayerView, fraction: Double ->
        view.seek(fraction)
      }

      AsyncFunction("setVolume") { view: VlcPlayerView, volume: Double ->
        view.setVolume(volume.toInt())
      }

      AsyncFunction("setRate") { view: VlcPlayerView, rate: Double ->
        view.setRate(rate)
      }

      AsyncFunction("getAudioTracks") { view: VlcPlayerView ->
        view.getAudioTracks()
      }

      AsyncFunction("setAudioTrack") { view: VlcPlayerView, trackId: Int ->
        view.setAudioTrack(trackId)
      }

      AsyncFunction("getSubtitleTracks") { view: VlcPlayerView ->
        view.getSubtitleTracks()
      }

      AsyncFunction("setSubtitleTrack") { view: VlcPlayerView, trackId: Int ->
        view.setSubtitleTrack(trackId)
      }

      OnViewDestroys { view: VlcPlayerView ->
        view.cleanup()
      }
    }
  }
}
