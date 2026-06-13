import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function HeartPrediction() {
  const [formData, setFormData] = useState({
    age: 40,
    sex: "M",
    chest_pain: "ATA",
    resting_bp: 120,
    cholesterol: 200,
    fasting_bs: 0,
    resting_ecg: "Normal",
    max_hr: 150,
    exercise_angina: "N",
    oldpeak: 1.0,
    st_slope: "Up"
  });
  const [result, setResult] = useState<{ prediction: number; probability: number | null; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await apiRequest("POST", "/api/predict/heart", formData);
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <CardTitle>Heart Disease Risk Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Age</Label>
              <Input type="number" value={formData.age} onChange={(e) => updateField("age", parseInt(e.target.value))} min={18} max={100} />
            </div>
            <div>
              <Label>Sex</Label>
              <Select value={formData.sex} onValueChange={(v) => updateField("sex", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="F">F</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Chest Pain Type</Label>
              <Select value={formData.chest_pain} onValueChange={(v) => updateField("chest_pain", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATA">ATA</SelectItem>
                  <SelectItem value="NAP">NAP</SelectItem>
                  <SelectItem value="TA">TA</SelectItem>
                  <SelectItem value="ASY">ASY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Resting Blood Pressure (mm Hg)</Label>
              <Input type="number" value={formData.resting_bp} onChange={(e) => updateField("resting_bp", parseInt(e.target.value))} min={80} max={200} />
            </div>
            <div>
              <Label>Cholesterol (mg/dL)</Label>
              <Input type="number" value={formData.cholesterol} onChange={(e) => updateField("cholesterol", parseInt(e.target.value))} min={100} max={600} />
            </div>
            <div>
              <Label>Fasting Blood Sugar &gt; 120 mg/dL</Label>
              <Select value={String(formData.fasting_bs)} onValueChange={(v) => updateField("fasting_bs", parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (No)</SelectItem>
                  <SelectItem value="1">1 (Yes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Resting ECG</Label>
              <Select value={formData.resting_ecg} onValueChange={(v) => updateField("resting_ecg", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="ST">ST</SelectItem>
                  <SelectItem value="LVH">LVH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max Heart Rate</Label>
              <Input type="number" value={formData.max_hr} onChange={(e) => updateField("max_hr", parseInt(e.target.value))} min={60} max={220} />
            </div>
            <div>
              <Label>Exercise-Induced Angina</Label>
              <Select value={formData.exercise_angina} onValueChange={(v) => updateField("exercise_angina", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Y">Y</SelectItem>
                  <SelectItem value="N">N</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Oldpeak (ST Depression)</Label>
              <Input type="number" step="0.1" value={formData.oldpeak} onChange={(e) => updateField("oldpeak", parseFloat(e.target.value))} min={0} max={6} />
            </div>
            <div>
              <Label>ST Slope</Label>
              <Select value={formData.st_slope} onValueChange={(v) => updateField("st_slope", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Up">Up</SelectItem>
                  <SelectItem value="Flat">Flat</SelectItem>
                  <SelectItem value="Down">Down</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Predicting..." : "Predict"}
            </Button>
          </form>
          {error && <div className="mt-4 text-red-600">{error}</div>}
          {result && (
            <div className={`mt-4 p-4 rounded-lg ${result.prediction === 1 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
              <p className="font-bold">{result.message}</p>
              {result.probability !== null && <p>Confidence: {(result.probability * 100).toFixed(2)}%</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}