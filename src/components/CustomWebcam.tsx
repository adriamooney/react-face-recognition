import { useRef, useState, useCallback, useEffect } from "react"; // import useRef
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import '@mediapipe/face_mesh'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { drawMesh } from '../utils/drawMesh';
import Webcam from "react-webcam";


function CustomWebcam() {

  const inputResolution = {
    width: 640,
    height: 360,
  };
  const videoConstraints = {
    width: inputResolution.width,
    height: inputResolution.height,
    facingMode: "user",
  };

  const [isCaptureEnable, setCaptureEnable] = useState<boolean>(false);
  const webcamRef = useRef<Webcam>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [canvasUrl, setCanvasUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [faceDrawn, setFaceDrawn] = useState<boolean>(false);

  const handleVideoLoad = (videoNode) => {
    const video = videoNode.target;
    if (video.readyState !== 4) return;
    if (loaded) return;
    runDetector(video, canvasRef.current); //running detection on video
    setLoaded(true);

  };


  const capture = useCallback(async () => {

    const imageSrc = webcamRef.current?.getScreenshot();
    const canvas = canvasRef.current;
    
    const image = new Image();

    const canvasMesh = canvas.toDataURL();

    if (canvasMesh) {
      setCanvasUrl(canvasMesh);
    }

    image.src = imageSrc;

    if (imageSrc) {
      setUrl(imageSrc);
    }
  }, [webcamRef, canvasRef]);



  const runDetector = async (video:any, canvas:HTMLCanvasElement) => {
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig:any = {
        runtime: "tfjs",
      };
      const detector = await faceLandmarksDetection.createDetector(
        model,
        detectorConfig
      );
      const detect = async (net) => {
        const estimationConfig = { flipHorizontal: false };
        if (! video.videoWidth || ! video.videoHeight) {
          return;
        }
        const faces = await net.estimateFaces(video, estimationConfig);
  
        const ctx = canvas.getContext("2d");
        requestAnimationFrame(() => drawMesh(faces[0], ctx));
  
        setFaceDrawn(true);
    
        detect(detector); //rerun the detect function after estimating 
  
       
      };
     
      detect(detector);  //first run of the detect function
      
    };




  useEffect(()=> {
    setFaceDrawn(false);
    const video = document.getElementById('webcam');
    if(video) {
     runDetector(video, canvasRef.current); //running detection on video
    }

  }, [isCaptureEnable])


  return (
    <>
    <header>
      <h1>Face Recognition</h1>
    </header>
    <div className="controls">
     
      {isCaptureEnable || <button className="btn" onClick={() => setCaptureEnable(true)}>start</button>}
      {isCaptureEnable && <button className="btn" onClick={() => {
        setCaptureEnable(false)
        setFaceDrawn(false);
        setUrl(null)
        setCanvasUrl(null)}}>end</button>}{faceDrawn && <button className="btn" onClick={capture}>capture</button>}
      {url && <button className="btn" onClick={() => { 
        setUrl(null)
        setCanvasUrl(null)
      }}> delete </button>}
    </div>
    <div className="webcam__wrapper">
    {isCaptureEnable && (
      <>
      <div className="video__wrapper">
      {!faceDrawn && isCaptureEnable && <div className="loading">...loading face recognition</div> }
          <Webcam
            id="webcam"
            audio={false}
            width={inputResolution.width}
            height={inputResolution.height}
            ref={webcamRef}
            videoConstraints={videoConstraints}
            onLoadedData={handleVideoLoad}
          />
      </div>
      <div className="canvas__wrapper">
          <canvas
            ref={canvasRef}
            width={inputResolution.width}
            height={inputResolution.height}
          />
     </div>
      </>
    )}
    
     
    
    </div>
      <div className="captured__img--wrapper">
        {isCaptureEnable &&
        <><img src={url} className="captured__img" />
        <img src={canvasUrl}  className="captured__img--mesh" /></>}
      </div>
  </>
  );
}

export default CustomWebcam;


