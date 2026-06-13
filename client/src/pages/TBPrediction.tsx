import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Upload } from "lucide-react";
import { Link } from "wouter";

export default function TBPrediction() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ prediction: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/predict/tb', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.detail || "Prediction failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tuberculosis Chest X‑ray Detection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-64 mx-auto mb-4" />
            ) : (
              <div className="py-8">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Click to upload a chest X‑ray image</p>
              </div>
            )}
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              {preview ? "Change Image" : "Select Image"}
            </Button>
          </div>
          {file && (
            <Button onClick={handleUpload} disabled={loading} className="w-full">
              {loading ? "Analyzing..." : "Predict"}
            </Button>
          )}
          {error && <div className="text-red-600">{error}</div>}
          {result && (
            <div className={`p-4 rounded-lg ${result.prediction === 'Tuberculosis' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              <p className="font-bold">Prediction: {result.prediction}</p>
              <p>Confidence: {(result.confidence * 100).toFixed(2)}%</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}