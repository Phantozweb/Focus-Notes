
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Camera, AlertTriangle, Loader2, Wand2, UploadCloud, X, ArrowLeft } from 'lucide-react';
import { convertSheetToEmr } from '@/ai/flows/convert-sheet-to-emr';
import type { FullOptometryCaseData } from '@/types/case';

export default function ScanCasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  React.useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
         setHasCameraPermission(false);
         toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };
  
  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    
    try {
      const result = await convertSheetToEmr({ imageDataUri: capturedImage });
      
      // Store the result in localStorage to be picked up by the new case page
      localStorage.setItem('prefilledCaseData', result.extractedDataJson);

      toast({
        title: 'Analysis Complete!',
        description: 'Redirecting to the new case form with pre-filled data.',
      });

      // Redirect to the new case page with a query param to signal pre-filling
      router.push('/cases/new?template=default&prefill=true');

    } catch (error) {
      console.error("AI Analysis failed:", error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderContent = () => {
    if (hasCameraPermission === null) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Initializing camera...</p></div>;
    }

    if (!hasCameraPermission) {
      return (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Camera Access Required</AlertTitle>
          <AlertDescription>
            This feature needs camera access to scan physical documents. Please enable camera permissions for this site in your browser settings and refresh the page.
          </AlertDescription>
        </Alert>
      );
    }

    if (capturedImage) {
      return (
        <div className="space-y-6 flex flex-col items-center">
          <h3 className="text-xl font-semibold text-center">Image Preview</h3>
          <img src={capturedImage} alt="Captured case sheet" className="rounded-lg shadow-lg max-w-full h-auto max-h-[60vh] border" />
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button onClick={() => setCapturedImage(null)} variant="outline" size="lg" className="w-full sm:w-auto">
              <X className="mr-2 h-5 w-5" /> Retake
            </Button>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} size="lg" className="w-full sm:w-auto">
              {isAnalyzing ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Analyzing...</>
              ) : (
                <><Wand2 className="mr-2 h-5 w-5" /> Analyze with AI</>
              )}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 flex flex-col items-center">
        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border shadow-inner">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        </div>
        <Button onClick={handleCapture} size="lg" className="w-full max-w-xs">
          <Camera className="mr-2 h-5 w-5" /> Capture Image
        </Button>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-4xl mx-auto shadow-xl">
          <CardHeader>
             <div className="flex items-center mb-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                  <ArrowLeft className="h-5 w-5" /><span className="sr-only">Back</span>
                </Button>
                <div className="flex-grow">
                  <CardTitle className="text-2xl md:text-3xl font-bold text-primary">Convert Physical Sheet</CardTitle>
                  <CardDescription>Position your case sheet within the frame and capture a clear image.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderContent()}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
