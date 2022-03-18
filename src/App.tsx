import React, { useState } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const ENABLE_LOG = false;
const width = 500;
const height = -1;

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [converting, setConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [srcBefore, setSrc2Before] = useState("");
  const [src, setSrc] = useState<string>("");

  const ffmpeg = createFFmpeg({
    log: ENABLE_LOG ?? false,
    corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
    progress: (p) => {
      setProgress(p.ratio);
    },
  });
  const convertVideo = async (file: File) => {
    try {
      setConverting(true);
      await ffmpeg.load();

      const mediaType = file.type.split("/")[0];

      if (mediaType !== "video") throw new Error("not video");

      const name = file.name;
      const type = file.type;

      const encodedName = encodeURIComponent(name);

      ffmpeg.FS("writeFile", encodedName, await fetchFile(file));

      await ffmpeg.run(
        "-i",
        encodedName,
        "-vf",
        `scale=${width || 720}:${height || -1}`,
        "output.mp4"
      );
      const data = ffmpeg.FS("readFile", "output.mp4");

      const src = URL.createObjectURL(new Blob([data.buffer], { type }));
      setSrc(src);
    } catch (e) {
      console.error(e);
    } finally {
      setConverting(false);
    }
  };
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e?.currentTarget?.files;
    if (!files) throw new Error("no files has been added");
    if (!files?.length) throw new Error("no files has been added");
    const file = files[0];
    console.log(file);
    setFile(file);

    // convertVideo(file);

    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.onloadedmetadata = function () {
      window.URL.revokeObjectURL(videoEl.src);
      const duration = videoEl.duration;
      setDuration(duration);
    };
    const srcBefore = URL.createObjectURL(file);
    setSrc2Before(srcBefore);
    videoEl.src = srcBefore;
  };

  const handleConvert = async (_: React.MouseEvent) => {
    try {
      if (!file) throw new Error("no file");
      await convertVideo(file);
    } catch (e: any) {
      if (e?.message === "no file") alert("add file first");
      else console.error(e);
    }
  };
  return (
    <div className="App">
      <div>add a file</div>

      <input
        type="file"
        id="avatar"
        name="avatar"
        accept="video/*"
        onChange={handleVideoChange}
      />

      <div>{duration ? `${duration} seconds` : "no duration"}</div>

      <div>click button bellow to start converting</div>

      <button onClick={handleConvert}>start converting</button>
      <div>
        {!converting
          ? "click button to start converting"
          : progress === null
          ? "convert video is not in progress"
          : `video converting... ${progress * 100} %`}
      </div>
      <div>
        {file && (
          <>
            <a href={srcBefore}>after {srcBefore}</a>
            <video
              src={srcBefore}
              controls
              autoPlay
              style={{ width: "200px", objectFit: "cover" }}
            />
          </>
        )}
      </div>
      <div>
        {src && (
          <>
            <a href={src}>after {src}</a>
            <video
              src={src}
              controls
              autoPlay
              style={{ width: "200px", objectFit: "cover" }}
            />
          </>
        )}
      </div>
    </div>
  );
}
