// import { useState } from "react";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Calendar } from "@/components/ui/calendar";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { ArrowLeft, Calendar as CalendarIcon, Download, CheckCircle2, User } from "lucide-react";
// import { Link, useLocation } from "wouter";
// import { ThemeToggle } from "@/components/theme-toggle";
// import { apiRequest, queryClient } from "@/lib/queryClient";
// import { insertAppointmentSchema, type InsertAppointment, type Doctor } from "@shared/schema";
// import templates from "@shared/templates.json";
// import { format } from "date-fns";
// import { useToast } from "@/hooks/use-toast";

// const TIMEZONES = [
//   "America/New_York",
//   "America/Chicago",
//   "America/Denver",
//   "America/Los_Angeles",
//   "Europe/London",
//   "Europe/Paris",
//   "Asia/Tokyo",
//   "Asia/Shanghai",
//   "Australia/Sydney",
// ];

// const TIME_SLOTS = [
//   "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
//   "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
//   "16:00", "16:30", "17:00"
// ];

// export default function Appointments() {
//   const [, setLocation] = useLocation();
//   const [step, setStep] = useState(1);
//   const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
//   const [selectedDate, setSelectedDate] = useState<Date | undefined>();
//   const [selectedTime, setSelectedTime] = useState<string>("");
//   const [bookingId, setBookingId] = useState<string | null>(null);
//   const { toast } = useToast();

//   const { data: doctors, isLoading: doctorsLoading } = useQuery<Doctor[]>({
//     queryKey: ["/api/doctors"],
//   });

//   const form = useForm<InsertAppointment>({
//     resolver: zodResolver(insertAppointmentSchema),
//     defaultValues: {
//       patientName: "",
//       patientEmail: "",
//       doctorId: "",
//       appointmentDate: "",
//       timezone: "America/New_York",
//       reason: "",
//     },
//   });

//   const bookAppointmentMutation = useMutation({
//     mutationFn: async (data: InsertAppointment) => {
//       return await apiRequest("POST", "/api/appointments", data);
//     },
//     onSuccess: (data) => {
//       setBookingId(data.id);
//       setStep(4);
//       toast({
//         title: "Success!",
//         description: templates.chat.bookingSuccess,
//       });
//       queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
//     },
//     onError: () => {
//       toast({
//         title: "Error",
//         description: templates.chat.bookingError,
//         variant: "destructive",
//       });
//     },
//   });

//   const downloadICSMutation = useMutation({
//     mutationFn: async (appointmentId: string) => {
//       const response = await fetch(`/api/appointments/${appointmentId}/ics`);
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = "appointment.ics";
//       a.click();
//       window.URL.revokeObjectURL(url);
//     },
//   });

//   const handleDoctorSelect = (doctor: Doctor) => {
//     setSelectedDoctor(doctor);
//     setStep(2);
//   };

//   const handleDateTimeSelect = () => {
//     if (selectedDate && selectedTime) {
//       setStep(3);
//     }
//   };

//   const onSubmit = (data: InsertAppointment) => {
//     if (!selectedDoctor || !selectedDate || !selectedTime) {
//       toast({
//         title: "Error",
//         description: "Please select all required information",
//         variant: "destructive",
//       });
//       return;
//     }

//     const dateTime = new Date(selectedDate);
//     const [hours, minutes] = selectedTime.split(":");
//     dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

//     const completeData: InsertAppointment = {
//       ...data,
//       doctorId: selectedDoctor.id,
//       appointmentDate: dateTime.toISOString(),
//     };

//     bookAppointmentMutation.mutate(completeData);
//   };

//   const { steps: stepLabels } = templates.ui.booking;

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
//         <div className="container flex h-16 items-center justify-between px-4">
//           <div className="flex items-center gap-4">
//             <Link href="/">
//               <Button variant="ghost" size="icon" data-testid="button-back">
//                 <ArrowLeft className="h-5 w-5" />
//               </Button>
//             </Link>
//             <h1 className="font-bold text-xl">{templates.ui.booking.title}</h1>
//           </div>
//           <ThemeToggle />
//         </div>
//       </header>

//       <main className="container max-w-4xl mx-auto px-4 py-8">
//         <div className="mb-8">
//           <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
//             {stepLabels.map((label, index) => (
//               <div key={index} className="flex items-center gap-2 flex-shrink-0">
//                 <div
//                   className={`flex items-center gap-3 ${
//                     step > index + 1 ? "text-primary" : step === index + 1 ? "text-foreground" : "text-muted-foreground"
//                   }`}
//                 >
//                   <div
//                     className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm ${
//                       step > index + 1
//                         ? "bg-primary text-primary-foreground"
//                         : step === index + 1
//                         ? "bg-accent text-accent-foreground"
//                         : "bg-muted text-muted-foreground"
//                     }`}
//                     data-testid={`step-indicator-${index + 1}`}
//                   >
//                     {step > index + 1 ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
//                   </div>
//                   <span className="text-sm font-medium hidden sm:inline">{label}</span>
//                 </div>
//                 {index < stepLabels.length - 1 && (
//                   <div className={`h-0.5 w-12 ${step > index + 1 ? "bg-primary" : "bg-muted"}`} />
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {step === 1 && (
//           <div className="space-y-6">
//             <div>
//               <h2 className="text-2xl font-bold mb-2">{templates.ui.booking.selectDoctor}</h2>
//               <p className="text-muted-foreground font-serif">Choose a doctor based on your needs</p>
//             </div>
//             {doctorsLoading ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {[1, 2, 3, 4].map((i) => (
//                   <Card key={i} className="h-48 animate-pulse bg-muted" />
//                 ))}
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {doctors?.map((doctor) => (
//                   <Card
//                     key={doctor.id}
//                     className="cursor-pointer hover-elevate active-elevate-2 transition-all"
//                     onClick={() => doctor.available && handleDoctorSelect(doctor)}
//                     data-testid={`doctor-card-${doctor.id}`}
//                   >
//                     <CardContent className="p-6">
//                       <div className="flex items-start gap-4">
//                         <Avatar className="h-16 w-16">
//                           <AvatarImage src={doctor.avatar} alt={doctor.name} />
//                           <AvatarFallback>
//                             <User className="h-8 w-8" />
//                           </AvatarFallback>
//                         </Avatar>
//                         <div className="flex-1">
//                           <div className="flex items-start justify-between gap-2 mb-2">
//                             <h3 className="font-semibold text-lg">{doctor.name}</h3>
//                             <Badge
//                               variant={doctor.available ? "secondary" : "outline"}
//                               data-testid={`doctor-status-${doctor.id}`}
//                             >
//                               {doctor.available ? templates.ui.doctors.available : templates.ui.doctors.unavailable}
//                             </Badge>
//                           </div>
//                           <p className="text-sm text-muted-foreground font-serif">{doctor.specialty}</p>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {step === 2 && selectedDoctor && (
//           <div className="space-y-6">
//             <div>
//               <h2 className="text-2xl font-bold mb-2">{templates.ui.booking.selectDate}</h2>
//               <p className="text-muted-foreground font-serif">
//                 Booking with {selectedDoctor.name} - {selectedDoctor.specialty}
//               </p>
//             </div>
//             <Card>
//               <CardContent className="p-6 space-y-6">
//                 <div>
//                   <Label className="mb-3 block">{templates.ui.booking.timezone}</Label>
//                   <Select
//                     value={form.watch("timezone")}
//                     onValueChange={(value) => form.setValue("timezone", value)}
//                   >
//                     <SelectTrigger data-testid="select-timezone">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {TIMEZONES.map((tz) => (
//                         <SelectItem key={tz} value={tz}>
//                           {tz.replace(/_/g, " ")}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="flex justify-center">
//                   <Calendar
//                     mode="single"
//                     selected={selectedDate}
//                     onSelect={setSelectedDate}
//                     disabled={(date) => date < new Date()}
//                     className="rounded-md border"
//                     data-testid="calendar-date-picker"
//                   />
//                 </div>
//                 {selectedDate && (
//                   <div>
//                     <Label className="mb-3 block">Available Times ({form.watch("timezone")})</Label>
//                     <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
//                       {TIME_SLOTS.map((time) => (
//                         <Button
//                           key={time}
//                           variant={selectedTime === time ? "default" : "outline"}
//                           size="sm"
//                           onClick={() => setSelectedTime(time)}
//                           data-testid={`time-slot-${time}`}
//                         >
//                           {time}
//                         </Button>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//                 <div className="flex gap-2">
//                   <Button variant="outline" onClick={() => setStep(1)} data-testid="button-back-to-doctors">
//                     Back
//                   </Button>
//                   <Button
//                     onClick={handleDateTimeSelect}
//                     disabled={!selectedDate || !selectedTime}
//                     className="flex-1"
//                     data-testid="button-continue-to-details"
//                   >
//                     Continue
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {step === 3 && selectedDoctor && selectedDate && (
//           <div className="space-y-6">
//             <div>
//               <h2 className="text-2xl font-bold mb-2">Patient Information</h2>
//               <p className="text-muted-foreground font-serif">Please provide your details</p>
//             </div>
//             <Card>
//               <CardContent className="p-6">
//                 <Form {...form}>
//                   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//                     <FormField
//                       control={form.control}
//                       name="patientName"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>{templates.ui.booking.patientName}</FormLabel>
//                           <FormControl>
//                             <Input {...field} data-testid="input-patient-name" />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name="patientEmail"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>{templates.ui.booking.patientEmail}</FormLabel>
//                           <FormControl>
//                             <Input type="email" {...field} data-testid="input-patient-email" />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name="reason"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>{templates.ui.booking.reason}</FormLabel>
//                           <FormControl>
//                             <Textarea {...field} data-testid="input-reason" />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <Card className="bg-accent/20">
//                       <CardHeader>
//                         <CardTitle className="text-base">Appointment Summary</CardTitle>
//                       </CardHeader>
//                       <CardContent className="space-y-2 text-sm">
//                         <div className="flex justify-between">
//                           <span className="text-muted-foreground">Doctor</span>
//                           <span className="font-medium">{selectedDoctor.name}</span>
//                         </div>
//                         <div className="flex justify-between">
//                           <span className="text-muted-foreground">Date & Time</span>
//                           <span className="font-medium">
//                             {format(selectedDate, "MMM dd, yyyy")} at {selectedTime}
//                           </span>
//                         </div>
//                         <div className="flex justify-between">
//                           <span className="text-muted-foreground">Timezone</span>
//                           <span className="font-medium">{form.watch("timezone")}</span>
//                         </div>
//                       </CardContent>
//                     </Card>
//                     <div className="flex gap-2">
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() => setStep(2)}
//                         data-testid="button-back-to-datetime"
//                       >
//                         Back
//                       </Button>
//                       <Button
//                         type="submit"
//                         className="flex-1"
//                         disabled={bookAppointmentMutation.isPending}
//                         data-testid="button-confirm-booking"
//                       >
//                         {bookAppointmentMutation.isPending ? "Booking..." : templates.ui.booking.confirm}
//                       </Button>
//                     </div>
//                   </form>
//                 </Form>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {step === 4 && bookingId && (
//           <div className="space-y-6">
//             <Card className="border-primary/20">
//               <CardContent className="p-8 text-center">
//                 <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
//                   <CheckCircle2 className="h-8 w-8 text-primary" />
//                 </div>
//                 <h2 className="text-2xl font-bold mb-2">{templates.ui.booking.success}</h2>
//                 <p className="text-muted-foreground font-serif mb-6">
//                   Your appointment has been confirmed. You'll receive an email confirmation shortly.
//                 </p>
//                 <div className="space-y-3">
//                   <Button
//                     onClick={() => downloadICSMutation.mutate(bookingId)}
//                     className="w-full gap-2"
//                     disabled={downloadICSMutation.isPending}
//                     data-testid="button-download-ics"
//                   >
//                     <Download className="h-4 w-4" />
//                     {templates.ui.booking.downloadICS}
//                   </Button>
//                   <Button variant="outline" className="w-full" data-testid="button-go-to-chat" onClick={() => setLocation("/chat")}>
//                     Go to Chat
//                   </Button>
//                   <Button variant="ghost" className="w-full" data-testid="button-go-home" onClick={() => setLocation("/")}>
//                     Back to Home
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Download,
  CheckCircle2,
  User,
} from "lucide-react";

import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertAppointmentSchema,
  type InsertAppointment,
  type Doctor,
} from "@shared/schema";
import templates from "@shared/templates.json";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

type BookingStep = 1 | 2 | 3 | 4;

export default function Appointments() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<BookingStep>(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookingId, setBookingId] = useState<string | null>(null);

  // 🔽 Filter state
  const [filterSpecialty, setFilterSpecialty] = useState<string>("");
  const [filterHospital, setFilterHospital] = useState<string>("");
  const [filterLocation, setFilterLocation] = useState<string>("");
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [filterMaxFee, setFilterMaxFee] = useState<number>(10000);

  const { toast } = useToast();

  const { data: doctors, isLoading: doctorsLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  // 🔽 Filter logic copied from final version
  const filteredDoctors =
    doctors?.filter((doc) => {
      if (
        filterSpecialty &&
        !(
          doc.specialty.toLowerCase().includes(filterSpecialty.toLowerCase()) ||
          doc.subSpecialty?.toLowerCase().includes(filterSpecialty.toLowerCase())
        )
      )
        return false;

      if (
        filterHospital &&
        !doc.hospitalName
          ?.toLowerCase()
          .includes(filterHospital.toLowerCase())
      )
        return false;

      if (
        filterLocation &&
        !doc.locationArea
          ?.toLowerCase()
          .includes(filterLocation.toLowerCase())
      )
        return false;

      if (filterMinRating && doc.rating && doc.rating < filterMinRating)
        return false;

      if (filterMaxFee && doc.fee && doc.fee > filterMaxFee) return false;

      return true;
    }) || [];

  const form = useForm<InsertAppointment>({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: {
      patientName: "",
      patientEmail: "",
      doctorId: "",
      appointmentDate: "",
      timezone: "America/New_York",
      reason: "",
    },
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: InsertAppointment) => {
      return await apiRequest("POST", "/api/appointments", data);
    },
    onSuccess: (data) => {
      setBookingId(data.id);
      setStep(4);
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment booked",
        description: "Your appointment has been successfully scheduled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: error?.message ?? "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const downloadICSMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/appointments/${id}/ics`);
      if (!res.ok) throw new Error("Failed to generate calendar event");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "appointment.ics";
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: () => {
      toast({
        title: "Download failed",
        description: "Could not download calendar event.",
        variant: "destructive",
      });
    },
  });

  const handleDoctorSelect = (doctor: Doctor) => {
    if (!doctor.available) return;
    setSelectedDoctor(doctor);
    setStep(2);
  };

  const handleDateTimeSelect = () => {
    if (!selectedDate || !selectedTime || !selectedDoctor) return;

    const [hourStr, minuteStr] = selectedTime.split(":");
    const dateTime = new Date(selectedDate);
    dateTime.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0);

    const completeData: InsertAppointment = {
      patientName: form.getValues("patientName"),
      patientEmail: form.getValues("patientEmail"),
      doctorId: selectedDoctor.id,
      appointmentDate: dateTime.toISOString(),
      timezone: form.getValues("timezone") || "America/New_York",
      reason: form.getValues("reason"),
    };

    // we don't submit yet here; step 3 will confirm details
    form.setValue("doctorId", completeData.doctorId);
    form.setValue("appointmentDate", completeData.appointmentDate);
    setStep(3);
  };

  const handleSubmitDetails = (values: InsertAppointment) => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;

    const [hourStr, minuteStr] = selectedTime.split(":");
    const dateTime = new Date(selectedDate);
    dateTime.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0);

    const completeData: InsertAppointment = {
      ...values,
      doctorId: selectedDoctor.id,
      appointmentDate: dateTime.toISOString(),
    };

    bookAppointmentMutation.mutate(completeData);
  };

  const { steps: stepLabels } = templates.ui.booking;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="mr-2"
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold leading-none">
                {templates.ui.appointmentsTitle}
              </h1>
              <p className="text-xs text-muted-foreground">
                {templates.ui.appointmentsSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              data-testid="link-chat"
              onClick={() => setLocation("/chat")}
            >
              Chat
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container px-4 py-8">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {stepLabels.map((label, index) => {
              const stepNumber = (index + 1) as BookingStep;
              const isActive = step === stepNumber;
              const isCompleted = step > stepNumber;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={[
                      "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold",
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
                  </div>
                  <span className="hidden text-xs font-medium text-muted-foreground md:inline">
                    {label}
                  </span>
                  {index < stepLabels.length - 1 && (
                    <div className="hidden h-px w-8 bg-border md:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1 – Select doctor */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {templates.ui.booking.selectDoctor}
              </h2>
              <p className="text-muted-foreground font-serif">
                Choose a doctor based on your needs
              </p>
            </div>

            {/* 🔽 Filter card */}
            <Card className="bg-accent/5">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sm">Filter Doctors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs mb-2 block">Specialty</Label>
                    <Input
                      placeholder="Search specialty..."
                      value={filterSpecialty}
                      onChange={(e) => setFilterSpecialty(e.target.value)}
                      data-testid="filter-specialty"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-2 block">Hospital</Label>
                    <Input
                      placeholder="Search hospital..."
                      value={filterHospital}
                      onChange={(e) => setFilterHospital(e.target.value)}
                      data-testid="filter-hospital"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-2 block">Location</Label>
                    <Input
                      placeholder="Search location..."
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      data-testid="filter-location"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-2 block">
                      Min Rating: {filterMinRating.toFixed(1)}★
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={filterMinRating}
                      onChange={(e) =>
                        setFilterMinRating(parseFloat(e.target.value))
                      }
                      data-testid="filter-min-rating"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-2 block">
                      Max Fee: ₹{filterMaxFee}
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={filterMaxFee}
                      onChange={(e) =>
                        setFilterMaxFee(parseInt(e.target.value, 10))
                      }
                      data-testid="filter-max-fee"
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterSpecialty("");
                        setFilterHospital("");
                        setFilterLocation("");
                        setFilterMinRating(0);
                        setFilterMaxFee(10000);
                      }}
                      data-testid="button-clear-filters"
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {filteredDoctors.length} doctors found
                </p>
              </CardContent>
            </Card>

            {/* Doctor cards */}
            {doctorsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="h-48 animate-pulse bg-muted" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDoctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className="cursor-pointer hover-elevate active-elevate-2 transition-all"
                    onClick={() => doctor.available && handleDoctorSelect(doctor)}
                    data-testid={`card-doctor-${doctor.id}`}
                  >
                    <CardContent className="p-4 flex gap-4">
                      <Avatar className="h-12 w-12">
                        {doctor.avatar ? (
                          <AvatarImage src={doctor.avatar} alt={doctor.name} />
                        ) : (
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {doctor.name}
                          </h3>
                          <Badge
                            variant={doctor.available ? "secondary" : "outline"}
                            data-testid={`doctor-status-${doctor.id}`}
                            className="flex-shrink-0 text-xs"
                          >
                            {doctor.available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {doctor.specialty}
                        </p>
                        {doctor.subSpecialty && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {doctor.subSpecialty}
                          </p>
                        )}
                        {doctor.hospitalName && (
                          <p className="text-xs text-muted-foreground">
                            {doctor.hospitalName}
                            {doctor.locationArea ? ` • ${doctor.locationArea}` : ""}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {doctor.rating !== undefined && (
                            <span>{doctor.rating.toFixed(1)}★ rating</span>
                          )}
                          {doctor.fee !== undefined && (
                            <span>Fee: ₹{doctor.fee}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2 – Select date & time */}
        {step === 2 && selectedDoctor && (
          <Card>
            <CardHeader>
              <Button
                variant="ghost"
                size="icon"
                className="mb-2"
                onClick={() => setStep(1)}
                data-testid="button-back-to-doctors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="flex items-center gap-2">
                <span>Select appointment time with</span>
                <span className="font-semibold">{selectedDoctor.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-[1.5fr,1fr]">
              <div>
                <Label className="mb-3 block">
                  {templates.ui.booking.chooseDate}
                </Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  data-testid="calendar-date"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">
                    {templates.ui.booking.chooseTime}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(
                      (time) => (
                        <Button
                          key={time}
                          type="button"
                          variant={selectedTime === time ? "default" : "outline"}
                          onClick={() => setSelectedTime(time)}
                          data-testid={`button-time-${time}`}
                        >
                          {time}
                        </Button>
                      ),
                    )}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">
                    {templates.ui.booking.timezone}
                  </Label>
                  <Select
                    value={form.watch("timezone")}
                    onValueChange={(value) => form.setValue("timezone", value)}
                  >
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleDateTimeSelect}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1"
                    data-testid="button-continue-to-details"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 – Enter details */}
        {step === 3 && selectedDoctor && (
          <Card>
            <CardHeader>
              <Button
                variant="ghost"
                size="icon"
                className="mb-2"
                onClick={() => setStep(2)}
                data-testid="button-back-to-time"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Enter your details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-[1.3fr,1fr]">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmitDetails)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            data-testid="input-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for visit</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Briefly describe your symptoms or reason for appointment"
                            rows={4}
                            data-testid="input-reason"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      data-testid="button-confirm-booking"
                      disabled={bookAppointmentMutation.isPending}
                    >
                      {bookAppointmentMutation.isPending
                        ? "Booking..."
                        : "Confirm Appointment"}
                    </Button>
                  </div>
                </form>
              </Form>
              <div className="space-y-4 rounded-lg border bg-muted/40 p-4 text-sm">
                <h3 className="font-semibold mb-2">Appointment summary</h3>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    {selectedDoctor.avatar ? (
                      <AvatarImage
                        src={selectedDoctor.avatar}
                        alt={selectedDoctor.name}
                      />
                    ) : (
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">
                      {selectedDoctor.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDoctor.specialty}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {selectedDate
                        ? format(selectedDate, "PPP")
                        : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">
                      {selectedTime || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timezone</span>
                    <span className="font-medium">
                      {form.watch("timezone")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4 – Success */}
        {step === 4 && bookingId && (
          <Card className="max-w-xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl">
                Appointment confirmed!
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                We've sent a confirmation email with all the details.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p>
                  <span className="font-semibold">Appointment ID: </span>
                  <span className="font-mono text-xs">{bookingId}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => downloadICSMutation.mutate(bookingId)}
                  data-testid="button-download-ics"
                >
                  <Download className="h-4 w-4" />
                  Add to Calendar
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setStep(1);
                    setSelectedDoctor(null);
                    setSelectedDate(undefined);
                    setSelectedTime("");
                    setBookingId(null);
                    form.reset();
                  }}
                >
                  Book Another
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => setLocation("/chat")}
                  data-testid="button-go-to-chat"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat with assistant
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

