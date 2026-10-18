"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  BarChart3,
  Award,
  ChevronDown,
  Star,
  CheckCircle,
  ArrowRight,
  Users,
  Target,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  BookMarked,
  PenTool,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
} from "lucide-react";

/* ============================================================
   DATA
============================================================ */
const tabsData = [
  {
    id: "study",
    icon: BookOpen,
    label: "Study Material",
    title: "Comprehensive GDS Study Material",
    desc: "Access structured video lessons, topic-wise PDF notes, and curated study guides covering all GDS exam subjects — Maths, English, GK, Reasoning, and Postal Knowledge.",
    features: ["HD Video Lessons", "Chapter-wise PDFs", "Quick Revision Notes", "Previous Year Papers"],
    gradient: "from-red-50 via-red-100 to-red-200",
    accentColor: "text-brand-red",
    accentBg: "bg-red-50",
  },
  {
    id: "mock",
    icon: PenTool,
    label: "Mock Tests",
    title: "Practice with Real Exam Patterns",
    desc: "Take unlimited mock tests designed exactly like the actual GDS exam. Get instant results, detailed solutions, and performance insights to improve your score.",
    features: ["Full-length Tests", "Topic-wise Quizzes", "Detailed Solutions", "Time-based Practice"],
    gradient: "from-emerald-50 via-emerald-100 to-emerald-200",
    accentColor: "text-emerald-600",
    accentBg: "bg-emerald-50",
  },
  {
    id: "progress",
    icon: BarChart3,
    label: "Progress Tracker",
    title: "Track Every Step of Your Journey",
    desc: "Monitor your preparation with detailed analytics — track topics covered, test scores, time spent, strengths, and areas that need improvement.",
    features: ["Score Analytics", "Topic Coverage Map", "Streak Tracking", "Weakness Identifier"],
    gradient: "from-violet-50 via-violet-100 to-violet-200",
    accentColor: "text-violet-600",
    accentBg: "bg-violet-50",
  },
  {
    id: "cert",
    icon: Award,
    label: "Certification",
    title: "Earn Your Verified Certificate",
    desc: "Complete all modules, pass the final assessment, and earn a verified digital certificate that validates your GDS exam readiness.",
    features: ["Verified Badge", "Shareable Certificate", "Completion Proof", "Digital Credential"],
    gradient: "from-amber-50 via-amber-100 to-amber-200",
    accentColor: "text-amber-600",
    accentBg: "bg-amber-50",
  },
  {
    id: "pricing",
    icon: IndianRupee,
    label: "Plans & Pricing",
    title: "Affordable, One-Time Investment in Your Career",
    desc: "No recurring subscriptions or hidden costs. Get complete lifetime access to all 180+ video lessons, 200+ mock tests, and PDF notes with a single one-time payment.",
    features: ["One-Time Transparent Payment", "Instant Full Course Access", "200+ Mock Tests Included", "7-Day Refund Guarantee"],
    gradient: "from-rose-50 via-amber-50 to-orange-100",
    accentColor: "text-brand-red",
    accentBg: "bg-red-50",
  },
];

const processSteps = [
  {
    num: 1,
    title: "Enroll",
    desc: "Choose your course plan and get instant access to all video lectures, notes, and tests.",
    icon: Users,
    gradient: "from-red-400 to-rose-500",
  },
  {
    num: 2,
    title: "Study",
    desc: "Access video lessons, PDF notes, and topic-wise material at your own pace.",
    icon: BookMarked,
    gradient: "from-orange-400 to-amber-500",
  },
  {
    num: 3,
    title: "Practice",
    desc: "Take mock tests, solve previous year papers, and track your improvement.",
    icon: Target,
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    num: 4,
    title: "Get Selected",
    desc: "Ace the GDS exam with confidence and secure your government career.",
    icon: GraduationCap,
    gradient: "from-blue-400 to-indigo-500",
  },
];

const featureSections = [
  {
    badge: "Study Material",
    badgeIcon: BookOpen,
    title: "A smarter way to prepare for your GDS Exam",
    items: [
      {
        icon: BookOpen,
        title: "Chapter-wise video lessons",
        desc: "HD video lectures by experienced faculty covering Maths, English, GK, Reasoning, and Postal Knowledge.",
      },
      {
        icon: FileText,
        title: "Downloadable PDF study guides",
        desc: "Comprehensive notes, formula sheets, and quick-revision guides you can study offline anytime.",
      },
      {
        icon: Clock,
        title: "Learn at your own pace",
        desc: "No deadlines. Revisit lessons, pause, resume — your schedule, your progress.",
      },
    ],
    gradient: "from-red-300 via-red-400 to-rose-500",
    reverse: false,
  },
  {
    badge: "Mock Tests",
    badgeIcon: PenTool,
    title: "Practice makes selection possible",
    items: [
      {
        icon: Target,
        title: "Exam-pattern mock tests",
        desc: "Questions designed to match the actual GDS exam format, difficulty, and time constraints.",
      },
      {
        icon: BarChart3,
        title: "Instant performance analytics",
        desc: "Get detailed breakdowns of your accuracy, speed, and topic-wise performance after every test.",
      },
      {
        icon: Shield,
        title: "Previous year papers solved",
        desc: "Practice with actual questions from past GDS exams with step-by-step solutions.",
      },
    ],
    gradient: "from-emerald-300 via-teal-400 to-emerald-500",
    reverse: true,
  },
  {
    badge: "Performance",
    badgeIcon: TrendingUp,
    title: "Know exactly where you stand",
    items: [
      {
        icon: BarChart3,
        title: "Detailed score analytics",
        desc: "Visual dashboards showing your progress over time, topic mastery, and comparative ranking.",
      },
      {
        icon: Zap,
        title: "Smart recommendations",
        desc: "AI-powered suggestions on which topics to focus on based on your test performance patterns.",
      },
      {
        icon: TrendingUp,
        title: "Daily streak tracking",
        desc: "Build consistency with daily study streaks and milestone achievements to stay motivated.",
      },
    ],
    gradient: "from-violet-300 via-purple-400 to-indigo-500",
    reverse: false,
  },
];

const testimonials = [
  {
    name: "Rahul Verma",
    location: "Lucknow, UP",
    text: "I cleared the GDS exam in my first attempt thanks to DOP Study Academi. The mock tests were exactly like the real exam. The video lessons made complex topics easy to understand.",
    stat: "Selected in 1st attempt",
    image: "/images/testimonial_1.jpg",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    location: "Jaipur, Rajasthan",
    text: "The study material is incredibly well-organized. I could study on my phone during commute and take tests at home. The progress tracker helped me focus on weak areas.",
    stat: "Score improved by 40%",
    image: "/images/testimonial_2.jpg",
    rating: 5,
  },
  {
    name: "Amit Patel",
    location: "Ahmedabad, Gujarat",
    text: "Best GDS preparation platform I've found. The PDF notes are perfect for quick revision before the exam. The mock tests gave me the confidence I needed on exam day.",
    stat: "Rank 12 in district",
    image: "/images/testimonial_3.jpg",
    rating: 5,
  },
];

const faqs = [
  {
    q: "Is there any free trial available?",
    a: "DOP Study Academi is a premium, paid-only preparation platform to maintain top faculty quality, dedicated doubt support, and updated 2026 mock tests. We do not offer free trials, but your enrollment is 100% risk-free with our unconditional 7-Day Money-Back Guarantee.",
  },
  {
    q: "How do I enroll and access the study material?",
    a: "Select your preferred plan in the Pricing section above and complete the quick, secure online payment via UPI, card, or net banking. Your student dashboard is activated immediately with instant 24/7 access on mobile and desktop.",
  },
  {
    q: "What is the GDS Exam?",
    a: "The GDS (Gramin Dak Sevak) exam is conducted by India Post for recruiting staff for Branch Post Offices in rural areas. It covers Maths, English, GK, Reasoning, and Postal Knowledge.",
  },
  {
    q: "Are the mock tests based on the actual exam pattern?",
    a: "Yes! Our mock tests are designed to exactly match the latest GDS exam format — same question types, negative marking, difficulty level, and time limits.",
  },
  {
    q: "Can I study on my mobile phone?",
    a: "Absolutely. Our platform is fully responsive and works seamlessly on mobile phones, tablets, and desktops. You can also download PDF notes for offline study.",
  },
  {
    q: "What is the refund policy?",
    a: "We offer a 100% 7-day money-back guarantee. If you are not satisfied with the course material, contact our support team within 7 days of purchase for a hassle-free, full refund.",
  },
  {
    q: "How do I get the certificate?",
    a: "Complete all study modules and pass the final assessment with a minimum score of 60%. Your verified digital certificate is automatically generated and shareable.",
  },
];

const stats = [
  { value: "50,000+", label: "Students Enrolled" },
  { value: "95%", label: "Success Rate" },
  { value: "200+", label: "Mock Tests" },
  { value: "4.9", label: "Average Rating" },
];

/* ============================================================
   COMPONENTS
============================================================ */

function Hero() {
  return (
    <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 lg:pb-24 relative overflow-hidden">
      {/* Soft decorative gradient orbs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 pt-4">
        {/* Main heading */}
        <h1 className="animate-fade-in-up font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-charcoal leading-[1.08] tracking-tight mb-6">
          All the preparation{" "}
          <br className="hidden sm:block" />
          for{" "}
          <span className="text-brand-red">GDS Exam</span>
          ,{" "}
          <br className="hidden md:block" />
          handled.
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up-delay-1 text-gray-500 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
          From structured study material to mock tests and performance tracking, get everything you need to crack the Gramin Dak Sevak exam — in one platform.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up-delay-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
          <Link
            href="/enroll"
            className="w-full sm:w-auto bg-brand-red text-white font-semibold px-8 py-4 rounded-2xl hover:bg-brand-red-dark transition-all text-sm sm:text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
          >
            Enroll in GDS Batch
            <ArrowRight size={16} />
          </Link>
          <a
            href="#pricing"
            className="w-full sm:w-auto text-charcoal font-semibold px-8 py-4 rounded-2xl border border-gray-300 hover:border-gray-400 hover:bg-white transition-all text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer"
          >
            View Plans & Syllabus
          </a>
        </div>

        {/* Social proof */}
        <p className="text-xs sm:text-sm text-gray-400 font-medium">
          Trusted by <span className="text-charcoal font-semibold">50,000+</span> aspirants across India • Instant Lifetime Access • 100% Verified Content
        </p>
      </div>
    </section>
  );
}

function TabShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const active = tabsData[activeTab];

  // Automatically cycles: Study Material -> Mock Tests -> Progress Tracker -> Certification -> Plans & Pricing
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabsData.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section id="tabs" className="pb-16 sm:pb-24 relative scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Full-width gradient container like Calendly */}
        <div className={`rounded-3xl bg-gradient-to-br ${active.gradient} p-1 transition-all duration-700`}>
          <div className="bg-white/60 backdrop-blur-sm rounded-[22px] overflow-hidden">
            {/* Tab buttons bar */}
            <div className="flex items-center justify-center px-4 sm:px-8 pt-6 pb-4 border-b border-black/[0.04]">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                {tabsData.map((tab, i) => {
                  const Icon = tab.icon;
                  const isActive = i === activeTab;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(i)}
                      className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer select-none ${isActive
                        ? "bg-white/85 backdrop-blur-md text-charcoal font-semibold shadow-sm border border-white/90"
                        : "text-gray-500 hover:text-charcoal hover:bg-white/40 border border-transparent"
                        }`}
                    >
                      <Icon size={16} className={isActive ? active.accentColor : "text-gray-400"} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab content */}
            <div className="px-6 sm:px-10 lg:px-14 pb-10 pt-4">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                <div className="animate-scale-in" key={active.id}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${active.accentBg} ${active.accentColor} text-xs font-semibold mb-4`}>
                    <active.icon size={13} />
                    {active.label}
                  </div>
                  <h3 className="font-heading text-2xl sm:text-3xl font-bold text-charcoal leading-tight mb-4">
                    {active.title}
                  </h3>
                  <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-6">
                    {active.desc}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {active.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle size={15} className={active.accentColor} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <a
                    href={active.id === "pricing" ? "#pricing" : "#features"}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal hover:text-brand-red transition-colors group cursor-pointer"
                  >
                    {active.id === "pricing" ? "View all pricing plans" : "Learn more"}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>

                {/* Simulated UI card */}
                <div className="animate-scale-in" key={`card-${active.id}`}>
                  <div className={`rounded-2xl bg-gradient-to-br ${active.gradient} p-8 sm:p-10 min-h-[280px] sm:min-h-[340px] flex items-center justify-center shadow-lg`}>
                    <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-xs border border-gray-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl ${active.accentBg} flex items-center justify-center`}>
                          <active.icon size={20} className={active.accentColor} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-charcoal">{active.label}</p>
                          <p className="text-xs text-gray-400">DOP Study Academi</p>
                        </div>
                      </div>
                      {active.id === "study" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs p-2.5 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Mathematics</span>
                            <span className="font-bold text-brand-red">24 Lessons</span>
                          </div>
                          <div className="flex items-center justify-between text-xs p-2.5 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">General Knowledge</span>
                            <span className="font-bold text-brand-red">18 Lessons</span>
                          </div>
                          <div className="flex items-center justify-between text-xs p-2.5 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">English Language</span>
                            <span className="font-bold text-brand-red">15 Lessons</span>
                          </div>
                        </div>
                      )}
                      {active.id === "mock" && (
                        <div className="space-y-2">
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-black text-charcoal">85/100</p>
                            <p className="text-xs text-gray-400 mt-1">Last Test Score</p>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 bg-emerald-50 rounded-lg p-2 text-center">
                              <p className="text-sm font-bold text-emerald-600">72</p>
                              <p className="text-[10px] text-gray-400">Correct</p>
                            </div>
                            <div className="flex-1 bg-red-50 rounded-lg p-2 text-center">
                              <p className="text-sm font-bold text-brand-red">28</p>
                              <p className="text-[10px] text-gray-400">Incorrect</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {active.id === "progress" && (
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Maths</span>
                              <span className="font-bold text-violet-600">78%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: "78%" }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">English</span>
                              <span className="font-bold text-violet-600">92%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: "92%" }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">GK</span>
                              <span className="font-bold text-violet-600">65%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: "65%" }} />
                            </div>
                          </div>
                        </div>
                      )}
                      {active.id === "cert" && (
                        <div className="text-center space-y-3">
                          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center">
                            <Award size={28} className="text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-charcoal">GDS Exam Ready</p>
                            <p className="text-xs text-gray-400">Certificate of Completion</p>
                          </div>
                          <button className="w-full bg-charcoal text-white text-xs font-semibold py-2.5 rounded-lg">
                            View Certificate
                          </button>
                        </div>
                      )}
                      {active.id === "pricing" && (
                        <div className="space-y-3 text-left">
                          {/* Inner top card matching image style with white/light theme */}
                          <div className="bg-gray-50/90 border border-gray-200/90 rounded-xl p-3.5 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <Users size={14} className="text-gray-600" />
                                <span className="font-heading font-bold text-xs text-charcoal">Starter</span>
                              </div>
                              <span className="text-[9px] font-semibold text-gray-600 bg-white px-2 py-0.5 rounded-full border border-gray-200/90 shadow-2xs">
                                For Individuals
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between mb-2.5">
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-charcoal font-heading">₹999</span>
                                <span className="text-[10px] text-gray-500">/ one-time</span>
                              </div>
                              <span className="text-xs text-gray-400 line-through">₹1,999</span>
                            </div>
                            <a
                              href="#pricing"
                              className="block w-full bg-gradient-to-r from-brand-red to-brand-accent hover:from-brand-red-dark hover:to-brand-red text-white text-xs font-bold py-2 rounded-lg text-center shadow-md shadow-red-500/20 transition-all cursor-pointer"
                            >
                              Get Started
                            </a>
                          </div>

                          {/* Features list with green circle checkmarks */}
                          <div className="space-y-1.5 text-xs text-gray-700">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border border-emerald-500/30 bg-emerald-50 flex items-center justify-center shrink-0">
                                <CheckCircle size={11} className="text-emerald-600 shrink-0" />
                              </div>
                              <span>180+ HD Video Lessons (All Subjects)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border border-emerald-500/30 bg-emerald-50 flex items-center justify-center shrink-0">
                                <CheckCircle size={11} className="text-emerald-600 shrink-0" />
                              </div>
                              <span>200+ Full-Length Mock Tests & Quizzes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border border-emerald-500/30 bg-emerald-50 flex items-center justify-center shrink-0">
                                <CheckCircle size={11} className="text-emerald-600 shrink-0" />
                              </div>
                              <span>Downloadable PDF Notes & Formula Books</span>
                            </div>
                          </div>

                          {/* Pro features divider */}
                          <div className="flex items-center gap-2 my-2">
                            <div className="h-px bg-gray-200 flex-1" />
                            <span className="text-[9px] font-semibold text-gray-400 tracking-wider">Pro features</span>
                            <div className="h-px bg-gray-200 flex-1" />
                          </div>

                          <div className="space-y-1 text-xs text-gray-700">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border border-emerald-500/30 bg-emerald-50 flex items-center justify-center shrink-0">
                                <CheckCircle size={11} className="text-emerald-600 shrink-0" />
                              </div>
                              <span>Previous 5-Year Solved Papers</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border border-emerald-500/30 bg-emerald-50 flex items-center justify-center shrink-0">
                                <CheckCircle size={11} className="text-emerald-600 shrink-0" />
                              </div>
                              <span>Verified Certificate & 7-Day Refund</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustTicker() {
  const logos = [
    "Study Notes",
    "Video Classes",
    "Previous Papers",
    "Mock Tests",
    "Practice Sets",
    "Quick Revision",
    "GDS Syllabus",
    "Important Topics",
    "Current Affairs",
    "Exam Tips",
    "PDF Materials",
    "Daily Practice",
  ];

  return (
    <section className="py-10 sm:py-14 overflow-hidden border-y border-gray-200/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <p className="text-center text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider">
          Trusted by aspirants preparing for
        </p>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-warm to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-warm to-transparent z-10" />
        <div className="flex animate-ticker">
          {logos.map((logo, i) => (
            <div
              key={i}
              className="flex items-center justify-center min-w-[180px] sm:min-w-[200px] px-6 py-3"
            >
              <span className="text-sm sm:text-base font-bold text-gray-300 whitespace-nowrap tracking-wide">
                {logo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessFlow() {
  return (
    <section id="process" className="py-16 sm:py-24 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-brand-red text-xs font-semibold uppercase tracking-widest mb-2 font-heading">
            Your Path
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-charcoal leading-tight">
            From registration to selection
          </h2>
          <p className="text-gray-500 mt-4 text-sm sm:text-base max-w-lg mx-auto">
            A clear, structured journey to help you go from zero to GDS selected.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {processSteps.map(({ num, title, desc, icon: Icon, gradient }) => (
            <div key={num} className="card-hover group">
              <div className="bg-white rounded-2xl p-7 border border-gray-200/60 shadow-sm h-full">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-mono">
                    STEP {num}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-bold text-charcoal mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureSections() {
  return (
    <div id="features" className="space-y-0 scroll-mt-24">
      {featureSections.map(({ badge, badgeIcon: BadgeIcon, title, items, gradient, reverse }, sIdx) => (
        <section key={badge} className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`grid lg:grid-cols-12 gap-10 lg:gap-14 items-center`}>
              {/* Text side */}
              <div className={`lg:col-span-6 ${reverse ? "lg:order-2" : "lg:order-1"}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-charcoal text-xs font-semibold mb-5">
                  <BadgeIcon size={13} />
                  {badge}
                </div>
                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal leading-tight mb-8">
                  {title}
                </h2>
                <div className="space-y-6">
                  {items.map(({ icon: ItemIcon, title: itemTitle, desc: itemDesc }) => (
                    <div key={itemTitle} className="group">
                      <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-200/60">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-red/10 transition-colors">
                          <ItemIcon size={18} className="text-gray-500 group-hover:text-brand-red transition-colors" />
                        </div>
                        <div>
                          <h4 className="font-heading text-base font-bold text-charcoal mb-1">{itemTitle}</h4>
                          <p className="text-sm text-gray-500 leading-relaxed">{itemDesc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gradient card side */}
              <div className={`lg:col-span-6 ${reverse ? "lg:order-1" : "lg:order-2"}`}>
                <div className={`rounded-3xl bg-gradient-to-br ${gradient} min-h-[420px] sm:min-h-[480px] w-full flex items-center justify-center p-8 sm:p-12 shadow-xl relative overflow-hidden`}>
                  {/* Decorative circles */}
                  <div className="absolute top-6 right-6 w-32 h-32 bg-white/10 rounded-full" />
                  <div className="absolute bottom-10 left-8 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full" />

                  {/* Floating UI element */}
                  <div className="bg-white rounded-2xl p-7 shadow-2xl max-w-xs sm:max-w-sm w-full border border-white/80 animate-float relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <BadgeIcon size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-charcoal">{badge}</p>
                        <p className="text-[11px] text-gray-400">DOP Study Academi</p>
                      </div>
                    </div>
                    {sIdx === 0 && (
                      <div className="space-y-2">
                        <div className="h-2.5 bg-gray-100 rounded-full w-full" />
                        <div className="h-2.5 bg-gray-100 rounded-full w-3/4" />
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-gray-400">12 of 24 lessons</span>
                          <span className="text-xs font-bold text-brand-red">50%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-red rounded-full w-1/2" />
                        </div>
                      </div>
                    )}
                    {sIdx === 1 && (
                      <div className="space-y-2">
                        <div className="text-center bg-emerald-50 rounded-xl p-3">
                          <p className="text-xl font-black text-emerald-600">92%</p>
                          <p className="text-[10px] text-gray-400">Test Score</p>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          {[85, 92, 78, 95, 88].map((s, i) => (
                            <div key={i} className="flex-1 bg-emerald-100 rounded-md h-8 flex items-end justify-center pb-0.5">
                              <div className="bg-emerald-500 rounded-sm w-3" style={{ height: `${s * 0.3}px` }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {sIdx === 2 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Overall Progress</span>
                          <span className="font-bold text-violet-600">76%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full" style={{ width: "76%" }} />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <div className="flex-1 text-center p-2 bg-violet-50 rounded-lg">
                            <p className="text-lg font-black text-violet-600">18</p>
                            <p className="text-[9px] text-gray-400">Day Streak</p>
                          </div>
                          <div className="flex-1 text-center p-2 bg-purple-50 rounded-lg">
                            <p className="text-lg font-black text-purple-600">142</p>
                            <p className="text-[9px] text-gray-400">Hours</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function Stats() {
  const statItems = [
    {
      value: "50,000+",
      label: "Aspirants Enrolled",
      sub: "Across all 23 postal circles",
      icon: Users,
      color: "text-brand-red",
      bg: "bg-red-50",
    },
    {
      value: "95%",
      label: "Selection Rate",
      sub: "Consistent course finishers",
      icon: Target,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      value: "200+",
      label: "Full Mock Tests",
      sub: "Latest 2026 exam pattern",
      icon: PenTool,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      value: "4.9",
      label: "Average Rating",
      sub: "From 12,000+ student reviews",
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <section className="py-12 sm:py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-gray-200/80 shadow-lg relative overflow-hidden">
          {/* Subtle decorative glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-100/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:divide-x lg:divide-gray-200/70">
            {statItems.map(({ value, label, sub, icon: Icon, color, bg }, i) => (
              <div
                key={label}
                className={`text-center ${i > 0 ? "lg:pl-8" : ""}`}
              >
                <div className={`w-10 h-10 ${bg} ${color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs`}>
                  <Icon size={20} />
                </div>
                <p className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-charcoal tracking-tight mb-1">
                  {value}
                </p>
                <p className="text-sm font-bold text-gray-800 mb-0.5">{label}</p>
                <p className="text-xs text-gray-400 font-medium">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const coreFeatures = [
    "180+ HD Video Lessons (Maths, English, GK, Postal)",
    "200+ Full-Length Exam-Pattern Mock Tests",
    "Comprehensive PDF Notes & Formula Books",
    "Performance & All-India Rank Tracker",
  ];

  const proFeatures = [
    "Previous 5-Year Solved GDS Question Papers",
    "Unlimited Mock Test Re-takes with Step-by-Step Solutions",
    "Verified Course Completion Certificate",
    "7-Day 100% Hassle-Free Money-Back Guarantee",
  ];

  return (
    <section id="pricing" className="py-16 sm:py-24 relative scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Simple clean header */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-charcoal leading-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-500 mt-3 text-sm sm:text-base">
            One plan. Everything included until your exam.
          </p>
        </div>

        {/* Wide single card eliminating left and right empty gaps */}
        <div className="w-full rounded-[32px] bg-white text-charcoal p-6 sm:p-10 lg:p-12 border border-gray-200/90 shadow-xl relative overflow-hidden">
          {/* Subtle soft red accent glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Column: Elevated Price & Action Card */}
            <div className="lg:col-span-5">
              <div className="bg-gray-50/90 border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-gray-600" />
                    <span className="font-heading font-bold text-lg sm:text-xl text-charcoal">Starter</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200/90 shadow-2xs">
                    For Individuals
                  </span>
                </div>

                {/* Price display */}
                <div className="flex items-baseline justify-between mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-charcoal font-heading tracking-tight">₹999</span>
                    <span className="text-sm font-medium text-gray-500">/ one-time</span>
                  </div>
                  <span className="text-lg text-gray-400 font-semibold line-through">₹1,999</span>
                </div>

                {/* Main CTA button */}
                <Link
                  href="/enroll"
                  className="w-full bg-gradient-to-r from-brand-red to-brand-accent hover:from-brand-red-dark hover:to-brand-red text-white font-bold text-base py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Get Started & Enroll</span>
                  <ArrowRight size={18} />
                </Link>

                <p className="text-center text-xs text-gray-400 font-medium mt-3">
                  Full Exam Validity • 7-Day Money-Back Guarantee
                </p>
              </div>
            </div>

            {/* Right Column: Features checklist matching reference image */}
            <div className="lg:col-span-7">
              {/* Core Features list with green circle checkmarks */}
              <div className="space-y-3.5 mb-6">
                {coreFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm sm:text-base text-gray-700">
                    <div className="w-5 h-5 rounded-full border border-emerald-500/30 bg-emerald-50 flex items-center justify-center shrink-0">
                      <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Pro features divider matching image */}
              <div className="flex items-center gap-3 my-6">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Pro features</span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              {/* Pro features list with green checkmarks */}
              <div className="space-y-3.5">
                {proFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm sm:text-base text-gray-700">
                    <div className="w-5 h-5 rounded-full border border-emerald-500/30 bg-emerald-50 flex items-center justify-center shrink-0">
                      <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = testimonials[currentIndex];

  return (
    <section className="py-16 sm:py-24 overflow-hidden relative">
      {/* Soft gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/40 via-orange-50/30 to-pink-50/40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <p className="text-brand-red text-xs font-semibold uppercase tracking-widest mb-2 font-heading">
            Success Stories
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-charcoal leading-tight">
            Real students, real results.
          </h2>
        </div>

        {/* Testimonial card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-gray-200/60 shadow-xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="font-heading text-2xl sm:text-3xl font-bold text-charcoal leading-snug italic mb-6">
                  &ldquo;{current.stat}&rdquo;
                </p>
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8">
                  {current.text}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {current.name}
                  </span>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {current.location}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <img
                    src={current.image}
                    alt={current.name}
                    className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-lg border-4 border-white"
                  />
                  <div className="absolute -bottom-3 -right-3 bg-white rounded-xl px-3 py-1.5 shadow-lg border border-gray-100 flex items-center gap-1">
                    {Array.from({ length: current.rating }).map((_, i) => (
                      <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-gray-400 hover:text-charcoal"
            >
              <ChevronLeft size={18} />
            </button>
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`transition-all cursor-pointer rounded-full ${i === currentIndex
                  ? "w-8 h-2.5 bg-brand-red"
                  : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
                  }`}
              />
            ))}
            <button
              onClick={() => setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-gray-400 hover:text-charcoal"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="faq" className="py-16 sm:py-24 scroll-mt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-brand-red text-xs font-semibold uppercase tracking-widest mb-2 font-heading">
            FAQ
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-charcoal">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500 mt-3 text-sm sm:text-base">
            Everything you need to know about GDS exam preparation.
          </p>
        </div>
        <div className="space-y-3">
          {faqs.map(({ q, a }, idx) => (
            <div
              key={q}
              className={`bg-white rounded-2xl border transition-all overflow-hidden ${openFaq === idx
                ? "border-brand-red/20 shadow-md ring-1 ring-brand-red/10"
                : "border-gray-200/60 shadow-sm hover:border-gray-300"
                }`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer"
              >
                <span className="font-heading text-sm sm:text-base font-semibold text-charcoal pr-4">{q}</span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 shrink-0 transition-transform duration-300 ${openFaq === idx ? "rotate-180 text-brand-red" : ""
                    }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 -mt-1">
                  <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BottomCTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-charcoal via-gray-900 to-gray-800 rounded-3xl p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden">
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-900/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              Start your GDS journey today.
            </h2>
            <p className="text-gray-400 text-base sm:text-lg mb-10 max-w-xl mx-auto">
              Join 50,000+ aspirants preparing with India Post&apos;s leading prep platform. Full syllabus, mock tests, and faculty guidance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/enroll"
                className="w-full sm:w-auto bg-brand-red text-white font-semibold px-10 py-4 rounded-2xl hover:bg-brand-red-dark transition-all text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                Enroll in GDS Batch
                <ArrowRight size={16} />
              </Link>
              <a
                href="#pricing"
                className="w-full sm:w-auto text-white/80 font-medium px-8 py-4 rounded-2xl border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all text-base flex items-center justify-center cursor-pointer"
              >
                View Course Plans
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-6">
              Instant Course Activation • 100% GDS Syllabus Coverage • 7-Day Money-Back Guarantee
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PAGE
============================================================ */
export default function Home() {
  return (
    <main>
      <Hero />
      <TabShowcase />
      <TrustTicker />
      <ProcessFlow />
      <FeatureSections />
      <Stats />
      <Pricing />
      <Testimonials />
      <FAQ />
      <BottomCTA />
    </main>
  );
}
