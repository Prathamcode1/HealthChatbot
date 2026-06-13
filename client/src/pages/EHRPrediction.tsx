import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function EHRPrediction() {
  const [formData, setFormData] = useState({
    age: 40,
    gender: 1,        // 1 = male, 0 = female (as per notebook)
    cigsPerDay: 0,
    totChol: 200,
    sysBP: 120,
    diaBP: 80,
    BMI: 25,
    heartRate: 70,
    glucose: 90,
  });
  const [result, setResult] = useState<{ prediction: number; probability: number; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await apiRequest("POST", "/api/predict/ehr", formData);
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
          <CardTitle>10‑Year Coronary Heart Disease Risk Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Age</Label>
              <Input type="number" value={formData.age} onChange={(e) => updateField("age", parseInt(e.target.value))} min={18} max={100} />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={String(formData.gender)} onValueChange={(v) => updateField("gender", parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Male</SelectItem>
                  <SelectItem value="0">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cigarettes per Day</Label>
              <Input type="number" value={formData.cigsPerDay} onChange={(e) => updateField("cigsPerDay", parseInt(e.target.value))} min={0} max={70} />
            </div>
            <div>
              <Label>Total Cholesterol (mg/dL)</Label>
              <Input type="number" value={formData.totChol} onChange={(e) => updateField("totChol", parseInt(e.target.value))} min={100} max={600} />
            </div>
            <div>
              <Label>Systolic BP (mm Hg)</Label>
              <Input type="number" value={formData.sysBP} onChange={(e) => updateField("sysBP", parseInt(e.target.value))} min={80} max={250} />
            </div>
            <div>
              <Label>Diastolic BP (mm Hg)</Label>
              <Input type="number" value={formData.diaBP} onChange={(e) => updateField("diaBP", parseInt(e.target.value))} min={40} max={150} />
            </div>
            <div>
              <Label>BMI</Label>
              <Input type="number" step="0.1" value={formData.BMI} onChange={(e) => updateField("BMI", parseFloat(e.target.value))} min={10} max={60} />
            </div>
            <div>
              <Label>Heart Rate (bpm)</Label>
              <Input type="number" value={formData.heartRate} onChange={(e) => updateField("heartRate", parseInt(e.target.value))} min={40} max={200} />
            </div>
            <div>
              <Label>Glucose (mg/dL)</Label>
              <Input type="number" value={formData.glucose} onChange={(e) => updateField("glucose", parseInt(e.target.value))} min={50} max={400} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Predicting..." : "Predict"}
            </Button>
          </form>
          {error && <div className="mt-4 text-red-600">{error}</div>}
          {result && (
            <div className={`mt-4 p-4 rounded-lg ${result.prediction === 1 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
              <p className="font-bold">{result.message}</p>
              <p>Confidence: {(result.probability * 100).toFixed(2)}%</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}