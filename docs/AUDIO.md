# Narration and transcription

Narration is the timeline authority. `ffprobe` determines duration, codec, sample rate, and channels; ffmpeg decodes the audio for analysis and final muxing. MP3, WAV, and AAC/M4A work when the installed ffmpeg build supports their codecs. Preserve the user's original audio file.

Use `npm run audio:ingest -- --project PROJECT_ID` with the arguments in [CLI.md](../scripts/CLI.md). The analysis records silence intervals, approximate 0.1-second RMS intensity measurements, and silence-midpoint edit suggestions. These are technical cues, not semantic segmentation or a speech-quality judgment.

## Providers

The provider interface returns segments with start, end, text, and optional word timestamps. The implemented adapters are:

- `SuppliedTranscriptProvider`: reads plain text, splits phrases, and allocates duration by word count. Its alignment is explicitly **approximate**, not forced alignment.
- `TimestampJsonProvider`: accepts an array of timestamped segments or `{ "segments": [...] }` and validates order/bounds.
- `LocalCommandProvider`: runs a supplied executable plus argument array without a shell, substitutes `{audio}`, and expects timestamp JSON on stdout. It is an adapter for an installed local transcription tool, not a bundled speech model.

No paid cloud service is required and no speech model is downloaded automatically. A future adapter can implement `TranscriptionProvider`; validate its timestamps before storyboarding. Network transcription must be explicitly configured by the operator with their own provider and credentials.

```json
{
  "segments": [
    {
      "start": 0,
      "end": 2.4,
      "text": "Cena paliwa ma wiele przyczyn.",
      "words": [{ "start": 0.1, "end": 0.45, "text": "Cena" }]
    }
  ]
}
```

Word timestamps are optional. This abbreviated example illustrates format, not an actual aligned transcript. Check timestamps against listening; structural validation does not prove the words are correct or that silence detection found the desired edit.

For production synchronization, follow [the agent playbook](AGENT_PLAYBOOK.md#2-establish-speech-timing-from-evidence): analyze the whole recording, verify critical names/numbers against audio, create `scenes/sync-cues.md`, and time readable visual moments rather than just entrance starts. Retain absolute offsets when aligning chunks. Document uncertain cues and unavailable listening tools; do not certify word-level precision from the approximate provider.

## Duration precision

Audio duration can fall between video frames. Rendering uses enough frames to cover the audio and limits the encoded output to its target duration. QA allows the larger of one video frame or one AAC packet, plus a small mux tolerance. It is not possible to guarantee an arbitrary subframe visual endpoint in a constant-frame-rate video.

For an excerpt beginning after time zero, both visual sampling and audio trim must use the same starting time. A correctly sized MP4 with the wrong spoken excerpt still fails production review.
