
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Camera, AlertTriangle, Loader2, Wand2, UploadCloud, X, ArrowLeft, FileText, Image as ImageIcon, Send, FileDown, Eye } from 'lucide-react';
import { convertSheetToEmr, type ConvertSheetToEmrInput } from '@/ai/flows/convert-sheet-to-emr';
import { structureEmrData } from '@/ai/flows/structure-emr-data';
import { formatCaseSheet } from '@/ai/flows/format-case-sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import * as htmlToImage from 'html-to-image';
import { ScrollArea } from '@/components/ui/scroll-area';

function CameraTab() {
  const { toast } = useToast();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const { setCapturedImage } = useScanPage();

  React.useEffect(() => {
    let mediaStream: MediaStream | null = null;
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
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setStream(mediaStream);
        setHasCameraPermission(true);
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
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
    }
  }, [stream]);


  const handleCapture = () => {
    const canvas = document.createElement('canvas');
    if (videoRef.current && canvas) {
      const video = videoRef.current;
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

  if (hasCameraPermission === null) {
    return <div className="flex justify-center items-center h-full min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Initializing camera...</p></div>;
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

function UploadTab() {
  const { setUploadedFile, setCapturedImage } = useScanPage();
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCapturedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Only image uploads are supported for now. PDF and text file support is coming soon!");
      }
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg h-64">
      <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">Upload a File</h3>
      <p className="text-muted-foreground mb-4">Upload an image of your case sheet.</p>
      <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
      <Button asChild>
        <label htmlFor="file-upload" className="cursor-pointer">
          <ImageIcon className="mr-2 h-4 w-4" /> Browse Files
        </label>
      </Button>
      <p className="text-xs text-muted-foreground mt-2">PNG, JPG, WEBP accepted. PDF support coming soon.</p>
    </div>
  );
}

function TextTab() {
    const { rawText, setRawText } = useScanPage();
    return (
        <div className="space-y-4">
             <h3 className="text-lg font-semibold">Paste Raw Text</h3>
             <p className="text-sm text-muted-foreground">
                Copy and paste the unstructured text from your case notes, a document, or an email below. The AI will parse it into the EMR form.
            </p>
            <Textarea 
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your case notes here..."
                className="min-h-[250px] text-base"
            />
        </div>
    );
}

const ScanPageContext = React.createContext<{
  capturedImage: string | null;
  setCapturedImage: (image: string | null) => void;
  rawText: string;
  setRawText: (text: string) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  extractedText: string | null;
  setExtractedText: (text: string | null) => void;
} | null>(null);

function useScanPage() {
  const context = React.useContext(ScanPageContext);
  if (!context) {
    throw new Error('useScanPage must be used within a ScanPageProvider');
  }
  return context;
}

function ScanPageProvider({ children }: { children: React.ReactNode }) {
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [rawText, setRawText] = React.useState('');
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [extractedText, setExtractedText] = React.useState<string | null>(null);
  
  return (
    <ScanPageContext.Provider value={{ capturedImage, setCapturedImage, rawText, setRawText, uploadedFile, setUploadedFile, extractedText, setExtractedText }}>
      {children}
    </ScanPageContext.Provider>
  );
}

function ScanCasePageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { capturedImage, setCapturedImage, rawText, setRawText, extractedText, setExtractedText } = useScanPage();
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [isStructuring, setIsStructuring] = React.useState(false);
  const [isFormatting, setIsFormatting] = React.useState(false);
  const [formattedSheetHtml, setFormattedSheetHtml] = React.useState<string | null>(null);
  const formattedSheetRef = React.useRef<HTMLDivElement>(null);

  const handleExtractText = async () => {
    if (!capturedImage && !rawText.trim()) {
        toast({
            variant: 'destructive',
            title: 'No Input Provided',
            description: 'Please capture an image, upload a file, or paste text to analyze.',
        });
        return;
    }
    setIsExtracting(true);
    setFormattedSheetHtml(null);
    
    const aiInput: ConvertSheetToEmrInput = {};
    if (capturedImage) {
        aiInput.imageDataUri = capturedImage;
    }
    if (rawText.trim()) {
        aiInput.rawText = rawText.trim();
    }

    try {
      const result = await convertSheetToEmr(aiInput);
      setExtractedText(result.extractedText);
      toast({
        title: 'Text Extracted!',
        description: 'AI has processed the document. Choose your next action.',
      });
    } catch (error) {
      console.error("AI Extraction failed:", error);
      toast({
        variant: 'destructive',
        title: 'Text Extraction Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsExtracting(false);
    }
  };
  
  const handleSendToEmr = async () => {
    if (!extractedText) {
      toast({ variant: 'destructive', title: 'No text to process', description: 'Extracted text is missing.' });
      return;
    }
    setIsStructuring(true);
    try {
      const result = await structureEmrData({ rawText: extractedText });
      localStorage.setItem('prefilledCaseData', result.extractedDataJson);
      toast({
        title: 'Analysis Complete!',
        description: 'Redirecting to the new case form with pre-filled data.',
      });
      router.push('/cases/new?template=default&prefill=true');
    } catch (error) {
      console.error("AI Structuring failed:", error);
      toast({
        variant: 'destructive',
        title: 'Structuring Failed',
        description: error instanceof Error ? error.message : 'Could not structure the text for EMR.',
      });
    } finally {
      setIsStructuring(false);
    }
  };

  const handleFormatSheet = async () => {
    if (!extractedText) {
      toast({ variant: 'destructive', title: 'No text to format', description: 'Extracted text is missing.' });
      return;
    }
    setIsFormatting(true);
    try {
      const result = await formatCaseSheet({ rawText: extractedText });
      setFormattedSheetHtml(result.formattedHtml);
      toast({
        title: 'Digital Sheet Created!',
        description: 'Review your formatted case sheet below.',
      });
    } catch (error) {
      console.error("AI Formatting failed:", error);
      toast({
        variant: 'destructive',
        title: 'Formatting Failed',
        description: error instanceof Error ? error.message : 'Could not format the text.',
      });
    } finally {
      setIsFormatting(false);
    }
  };

  const downloadAsTxt = () => {
    if (formattedSheetRef.current) {
        const textContent = formattedSheetRef.current.innerText;
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'FocusCaseX_Sheet.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const downloadAsImage = () => {
    if (formattedSheetRef.current) {
        htmlToImage.toPng(formattedSheetRef.current, { quality: 0.95, backgroundColor: 'white' })
            .then(function (dataUrl) {
                const link = document.createElement('a');
                link.download = 'FocusCaseX_Sheet.png';
                link.href = dataUrl;
                link.click();
            })
            .catch(function (error) {
                console.error('oops, something went wrong!', error);
                toast({
                    variant: 'destructive',
                    title: 'Image Download Failed',
                    description: 'Could not generate the image for download.',
                });
            });
    }
  };

  const clearInputs = () => {
    setCapturedImage(null);
    setRawText('');
    setExtractedText(null);
    setFormattedSheetHtml(null);
  }

  if (isFormatting) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-semibold">Formatting Your Digital Sheet</h3>
            <p className="text-muted-foreground">The AI is organizing the data into a professional layout...</p>
        </div>
    );
  }

  if (formattedSheetHtml) {
    return (
       <div className="space-y-6">
        <h3 className="text-2xl font-bold text-center text-primary">Formatted Digital Case Sheet</h3>
        <p className="text-center text-muted-foreground text-sm max-w-2xl mx-auto">Review your AI-generated digital sheet. You can download it as a text file or an image, or send the original text to pre-fill the EMR form.</p>
        
        <ScrollArea className="max-h-[60vh] w-full border rounded-lg shadow-inner">
           <div ref={formattedSheetRef} className="p-6 bg-white text-black" dangerouslySetInnerHTML={{ __html: formattedSheetHtml }} />
        </ScrollArea>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
            <Button onClick={downloadAsTxt} variant="outline"><FileDown className="mr-2 h-4 w-4"/>Download as TXT</Button>
            <Button onClick={downloadAsImage} variant="outline"><ImageIcon className="mr-2 h-4 w-4"/>Download as Image</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center border-t pt-6 mt-4">
          <Button onClick={clearInputs} variant="secondary" size="lg" className="w-full sm:w-auto">
            <X className="mr-2 h-5 w-5" /> Start Over
          </Button>
          <Button onClick={handleSendToEmr} disabled={isStructuring} size="lg" className="w-full sm:w-auto">
            {isStructuring ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />} Fill EMR with Original Text
          </Button>
        </div>
      </div>
    );
  }

  if (extractedText) {
    return (
        <div className="space-y-6 flex flex-col items-center">
        <h3 className="text-xl font-semibold text-center">Text Extraction Complete!</h3>
        <p className="text-center text-muted-foreground text-sm">What would you like to do next?</p>
        <div className="p-4 border rounded-lg bg-muted w-full max-h-[50vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">{extractedText}</pre>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button onClick={handleFormatSheet} disabled={isFormatting} size="lg" className="w-full sm:w-auto">
                <Wand2 className="mr-2 h-5 w-5" /> Format as Digital Sheet
            </Button>
            <Button onClick={handleSendToEmr} disabled={isStructuring} size="lg" className="w-full sm:w-auto">
                <Send className="mr-2 h-5 w-5" /> Fill EMR Form Directly
            </Button>
        </div>
         <Button onClick={clearInputs} variant="link" className="mt-4 text-muted-foreground">
            <X className="mr-2 h-4 w-4" /> Start Over
        </Button>
        </div>
    );
  }

  if (capturedImage || rawText.trim()) {
    return (
      <div className="space-y-6 flex flex-col items-center">
        <h3 className="text-xl font-semibold text-center">Preview & Extract Text</h3>
        {capturedImage && <img src={capturedImage} alt="Captured case sheet" className="rounded-lg shadow-lg max-w-full h-auto max-h-[60vh] border" />}
        {rawText && !capturedImage && (
            <div className="p-4 border rounded-lg bg-muted w-full max-h-[40vh] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{rawText}</pre>
            </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button onClick={clearInputs} variant="outline" size="lg" className="w-full sm:w-auto">
            <X className="mr-2 h-5 w-5" /> Clear Input
          </Button>
          <Button onClick={handleExtractText} disabled={isExtracting} size="lg" className="w-full sm:w-auto">
            {isExtracting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Extracting Text...</>
            ) : (
              <><Wand2 className="mr-2 h-5 w-5" /> Extract Text with AI</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
      <Tabs defaultValue="camera" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4" />Camera</TabsTrigger>
              <TabsTrigger value="upload"><UploadCloud className="mr-2 h-4 w-4" />Upload</TabsTrigger>
              <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" />Text</TabsTrigger>
          </TabsList>
          <TabsContent value="camera" className="pt-6">
              <CameraTab />
          </TabsContent>
          <TabsContent value="upload" className="pt-6">
              <UploadTab />
          </TabsContent>
          <TabsContent value="text" className="pt-6">
              <TextTab />
          </TabsContent>
      </Tabs>
  );
}


export default function ScanCasePage() {
    const router = useRouter();

    return (
      <MainLayout>
        <ScanPageProvider>
            <div className="container py-8 px-4 sm:px-6 lg:px-8">
                <Card className="max-w-4xl mx-auto shadow-xl">
                <CardHeader>
                    <div className="flex items-center mb-2">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                        <ArrowLeft className="h-5 w-5" /><span className="sr-only">Back</span>
                        </Button>
                        <div className="flex-grow">
                        <CardTitle className="text-2xl md:text-3xl font-bold text-primary">Convert Document to EMR</CardTitle>
                        <CardDescription>Capture, upload, or paste your case notes to convert them with AI.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScanCasePageContent />
                </CardContent>
                </Card>
            </div>
        </ScanPageProvider>
      </MainLayout>
    );
}
