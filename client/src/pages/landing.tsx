import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Calendar, Shield, CheckCircle2, Users, Lock, ArrowRight, Activity, Stethoscope } from "lucide-react";
import { Link, useLocation } from "wouter";
import templates from "@shared/templates.json";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { landingHero, trustIndicators, features, howItWorks, cta } = templates.ui;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-2 rounded-lg transition-colors">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Health AI</span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" data-testid="link-chat" onClick={() => setLocation("/chat")}>
              Chat
            </Button>
            <Button variant="ghost" data-testid="link-appointments" onClick={() => setLocation("/appointments")}>
              Book Appointment
            </Button>
            <Button variant="ghost" data-testid="link-ehr" onClick={() => setLocation("/ehr-prediction")}>
              CHD Risk
            </Button>
            <Button variant="ghost" data-testid="link-tb" onClick={() => setLocation("/tb-prediction")}>
              TB X‑ray
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>
        <section className="relative min-h-[80vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
          <div className="absolute right-0 top-0 h-full w-full md:w-1/2 flex items-center justify-center pointer-events-none">
            <img
              src="/doctor_consulting_patient_with_technology.png"
              alt="Doctor consulting patient"
              className="max-h-[80%] w-auto object-contain opacity-90"
            />
          </div>

          <div className="container relative z-20 px-4 py-16 md:py-24">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                {landingHero.title}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 font-serif">
                {landingHero.subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gap-2" data-testid="button-cta-chat" onClick={() => setLocation("/chat")}>
                  <MessageSquare className="h-5 w-5" />
                  {landingHero.ctaPrimary}
                </Button>
                <Button size="lg" variant="outline" className="gap-2" data-testid="button-cta-appointment" onClick={() => setLocation("/appointments")}>
                  <Calendar className="h-5 w-5" />
                  {landingHero.ctaSecondary}
                </Button>
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-ehr" onClick={() => setLocation("/ehr-prediction")}>
                  <Activity className="h-5 w-5" />
                  10‑Year CHD Risk
                </Button>
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-tb" onClick={() => setLocation("/tb-prediction")}>
                  <Stethoscope className="h-5 w-5" />
                  TB X‑ray Detection
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-accent/20">
          <div className="container px-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              <Card data-testid="card-trust-citations">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{trustIndicators.citations.title}</h3>
                    <p className="text-muted-foreground font-serif">
                      {trustIndicators.citations.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-trust-doctors">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{trustIndicators.doctors.title}</h3>
                    <p className="text-muted-foreground font-serif">
                      {trustIndicators.doctors.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-trust-security">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{trustIndicators.security.title}</h3>
                    <p className="text-muted-foreground font-serif">
                      {trustIndicators.security.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-trust-ehr">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">10‑Year CHD Risk Predictor</h3>
                    <p className="text-muted-foreground font-serif">
                      Predict your risk of coronary heart disease using an XGBoost model.
                    </p>
                    <Button variant="link" onClick={() => setLocation("/ehr-prediction")}>
                      Try Now <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-trust-tb">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">TB Chest X‑ray Detector</h3>
                    <p className="text-muted-foreground font-serif">
                      Detect tuberculosis from chest X‑ray images using a deep learning model.
                    </p>
                    <Button variant="link" onClick={() => setLocation("/tb-prediction")}>
                      Try Now <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20">
          <div className="container px-4">
            <div className="max-w-5xl mx-auto space-y-16">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <Badge variant="secondary" className="mb-4">
                    RAG Technology
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    {features.chat.title}
                  </h2>
                  <p className="text-lg text-muted-foreground font-serif mb-6">
                    {features.chat.description}
                  </p>
                  <Button className="gap-2" data-testid="button-try-chat" onClick={() => setLocation("/chat")}>
                    Try Chat Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-card-border p-8 space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="bg-background rounded-lg p-4 text-sm font-serif">
                            What are the symptoms of type 2 diabetes?
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                          <Shield className="h-4 w-4 text-accent-foreground" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-background rounded-lg p-4 text-sm font-serif">
                            Common symptoms include increased thirst, frequent urination, increased hunger, and fatigue...
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              Source: CDC-2024-001
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Source: WHO-DM-2023
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <Card className="overflow-hidden md:order-2">
                  <CardContent className="p-0">
                    <div className="bg-card-border p-8 space-y-4">
                      <div className="bg-background rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Dr. Sarah Johnson</span>
                          <Badge variant="secondary">Available</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground font-serif">
                          Endocrinologist
                        </div>
                        <div className="pt-2 border-t">
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Date</span>
                              <span className="font-medium">Dec 20, 2024 at 2:00 PM</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Timezone</span>
                              <span className="font-medium">EST</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button className="w-full" size="lg">
                        Confirm Appointment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <div className="md:order-1">
                  <Badge variant="secondary" className="mb-4">
                    Smart Scheduling
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    {features.booking.title}
                  </h2>
                  <p className="text-lg text-muted-foreground font-serif mb-6">
                    {features.booking.description}
                  </p>
                  <Button className="gap-2" data-testid="button-try-booking" onClick={() => setLocation("/appointments")}>
                    Book Appointment
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works section */}
        <section className="py-20 bg-accent/20">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {howItWorks.title}
              </h2>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-8">
                {howItWorks.steps.map((step, index) => (
                  <div key={index} className="flex gap-6" data-testid={`step-${index + 1}`}>
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground font-serif">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {cta.title}
              </h2>
              <p className="text-lg text-muted-foreground font-serif mb-8">
                {cta.subtitle}
              </p>
              <div className="flex flex-wrap gap-4 justify-center mb-8">
                <Button size="lg" className="gap-2" data-testid="button-footer-chat" onClick={() => setLocation("/chat")}>
                  <MessageSquare className="h-5 w-5" />
                  Start Chatting
                </Button>
                <Button size="lg" variant="outline" className="gap-2" data-testid="button-footer-appointment" onClick={() => setLocation("/appointments")}>
                  <Calendar className="h-5 w-5" />
                  Book Now
                </Button>
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-footer-ehr" onClick={() => setLocation("/ehr-prediction")}>
                  <Activity className="h-5 w-5" />
                  Check CHD Risk
                </Button>
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-footer-tb" onClick={() => setLocation("/tb-prediction")}>
                  <Stethoscope className="h-5 w-5" />
                  Try TB Detection
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {cta.badges.map((badge, index) => (
                  <Badge key={index} variant="secondary" className="px-4 py-2">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-accent/10">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">CancerAssist</span>
              </div>
              <p className="text-sm text-muted-foreground font-serif">
                Health support and expert care scheduling
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <Link href="/chat" className="text-muted-foreground hover:text-foreground transition-colors block">
                  Health Chat
                </Link>
                <Link href="/appointments" className="text-muted-foreground hover:text-foreground transition-colors block">
                  Book Appointment
                </Link>
                <Link href="/ehr-prediction" className="text-muted-foreground hover:text-foreground transition-colors block">
                  CHD Risk Predictor
                </Link>
                <Link href="/tb-prediction" className="text-muted-foreground hover:text-foreground transition-colors block">
                  TB X‑ray Detector
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">Privacy Policy</p>
                <p className="text-muted-foreground">Terms of Service</p>
                <p className="text-muted-foreground">HIPAA Compliance</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 CancerAssist. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}