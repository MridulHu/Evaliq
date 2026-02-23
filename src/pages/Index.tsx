import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, Sparkles, Share2, PenTool } from "lucide-react";
import { motion, useMotionValue, useSpring, Variants } from "framer-motion";
import { useEffect, useState } from "react";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videoReady, setVideoReady] = useState(false);

  /* ================= Mouse Spotlight ================= */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  /* ================= Headline Animation ================= */
  const headline = "Create quizzes in seconds, share with everyone.";

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 18,
      },
    },
  };

  const features = [
    {
      title: "Structured Quiz Builder",
      description:
        "Create quizzes manually or generate them instantly with AI assistance.",
      meta: "Flexible creation",
    },
    {
      title: "Timer & Auto Submission",
      description:
        "Enforce time limits with real-time countdown and automatic submission.",
      meta: "Assessment control",
    },
    {
      title: "Attempt Limits",
      description:
        "Restrict retries and control how many times a participant can submit.",
      meta: "Submission governance",
    },
    {
      title: "Question Randomisation",
      description: "Shuffle questions per attempt to reduce answer sharing.",
      meta: "Integrity layer",
    },
    {
      title: "Security Safeguards",
      description:
        "Detect tab switching, block copy/paste, and auto-submit on violations.",
      meta: "Exam security",
    },
    {
      title: "Attempt Tracking",
      description:
        "Store scores, time taken, and participant activity automatically.",
      meta: "Built-in analytics",
    },
  ];
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
  className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-700 ${
    videoReady ? "opacity-0 pointer-events-none" : "opacity-100"
  }`}
>
  <div className="flex flex-col items-center gap-6">
    <div className="h-14 w-14 rounded-full border-4 border-white/20 border-t-purple-500 animate-spin" />
    <p className="text-white tracking-wide">Loading Evaliq</p>
  </div>
</div>
      {/* ================= VIDEO BACKGROUND ================= */}
    <div className="fixed inset-0 -z-30 bg-black overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setVideoReady(true)}
        className={`w-full h-full object-cover transition-opacity duration-1000 ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <source src="/hero-bg1.webm" type="video/webm" />
      </video>
    </div>

      {/* Mouse Glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `radial-gradient(600px at ${springX.get()}px ${springY.get()}px, rgba(99,102,241,0.15), transparent 80%)`,
        }}
      />

      {/* ================= NAV ================= */}
      <header className=" backdrop-blur-xl text-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <Brain className="h-7 w-7 text-white" />
            <span className="font-display text-xl font-bold relative">
              Evaliq
              <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full" />
            </span>
          </div>

          <Button
            onClick={() => navigate(user ? "/dashboard" : "/auth")}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 shadow-lg shadow-purple-500/30"
          >
            {user ? "Dashboard" : "Get Started"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="container py-28 md:py-36 text-center relative text-white">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          <h1 className="font-display text-6xl md:text-7xl font-bold leading-tight mb-6 tracking-tight flex flex-wrap justify-center gap-x-3">
            {headline.split(" ").map((word, i) => {
              const highlight =
                word.includes("seconds,") || word.includes("everyone.");

              return (
                <motion.span
                  key={i}
                  variants={wordVariants}
                  className={
                    highlight
                      ? "bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent"
                      : "text-white"
                  }
                >
                  {word}
                </motion.span>
              );
            })}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Build manually, generate with AI, or extract from documents. Share
            instantly with one simple link.
          </motion.p>
        </motion.div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="container pb-36 relative text-white">
        <div className="max-w-6xl mx-auto">
          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -6,
                  transition: { type: "spring", stiffness: 220 },
                }}
                className="relative group"
              >
                {/* Subtle glow on hover */}
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500/30 via-indigo-500/20 to-blue-500/30 opacity-0 group-hover:opacity-100 blur-lg transition duration-500" />

                {/* Glass Card */}
                <div
                  className="relative rounded-2xl p-8
                  bg-gradient-to-br from-white/12 via-white/6 to-white/12
                  backdrop-blur-2xl
                  border border-white/20
                  shadow-[0_25px_70px_rgba(0,0,0,0.45)]
                  transition-all duration-500"
                                >
                                  {/* Glass highlight */}
                                  <div
                                    className="pointer-events-none absolute inset-0 rounded-2xl
                    bg-gradient-to-tr from-white/40 via-transparent to-transparent
                    opacity-15"
                  />

                  {/* Title */}
                  <h3 className="text-lg font-semibold mb-3 tracking-tight">
                    {f.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    {f.description}
                  </p>

                  {/* Meta */}
                  <div className="text-xs uppercase tracking-widest text-gray-500">
                    {f.meta}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* ================= HOW IT WORKS ================= */}
      <section className="container py-28 text-white relative">
        <div className="max-w-6xl mx-auto">
          
            {/* Header */}
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold mb-4">
                From Creation to Delivery
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Build your quiz, review it, refine it, and deploy — all inside
                one controlled workflow.
              </p>
            </div>

            {/* ================= Creation Methods ================= */}
            <div className="grid md:grid-cols-3 gap-8 mb-20">
           <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileHover={{
              y: -6,
              transition: { type: "spring", stiffness: 220 }
            }}
            className="relative group"
          >

            {/* Hover Glow */}
            <div className="absolute -inset-[1px] rounded-2xl
              bg-gradient-to-r from-purple-500/30 via-indigo-500/20 to-blue-500/30
              opacity-0 group-hover:opacity-100 blur-lg transition duration-500" />

            {/* Glass Card */}
            <div className="relative rounded-2xl p-8 space-y-5
              bg-gradient-to-br from-white/12 via-white/6 to-white/12
              backdrop-blur-2xl
              border border-white/20
              shadow-[0_25px_70px_rgba(0,0,0,0.45)]
              transition-all duration-500">

              {/* Glass highlight */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl
                bg-gradient-to-tr from-white/40 via-transparent to-transparent
                opacity-15" />

              <div className="text-indigo-400 text-sm font-semibold tracking-widest ">
                METHOD 01
              </div>

              <h3 className="text-xl font-semibold">
                Manual Builder
              </h3>

              <p className="text-gray-400 leading-relaxed">
                Create each question with full control over options,
                scoring, and structure using the built-in editor.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileHover={{
              y: -6,
              transition: { type: "spring", stiffness: 220 }
            }}
            className="relative group"
          >

            {/* Hover Glow */}
            <div className="absolute -inset-[1px] rounded-2xl
              bg-gradient-to-r from-purple-500/30 via-indigo-500/20 to-blue-500/30
              opacity-0 group-hover:opacity-100 blur-lg transition duration-500" />

            {/* Glass Card */}
            <div className="relative rounded-2xl p-8 space-y-5
              bg-gradient-to-br from-white/12 via-white/6 to-white/12
              backdrop-blur-2xl
              border border-white/20
              shadow-[0_25px_70px_rgba(0,0,0,0.45)]
              transition-all duration-500">

              {/* Glass highlight */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl
                bg-gradient-to-tr from-white/40 via-transparent to-transparent
                opacity-15" />

              <div className="text-indigo-400 text-sm font-semibold tracking-widest">
                METHOD 02
              </div>

              <h3 className="text-xl font-semibold">
                Ai Quiz Generator
              </h3>

              <p className="text-gray-400 leading-relaxed">
                Define topic, class level, difficulty, and number of
                  questions. Instantly generate a structured quiz preview.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileHover={{
              y: -6,
              transition: { type: "spring", stiffness: 220 }
            }}
            className="relative group"
          >

            {/* Hover Glow */}
            <div className="absolute -inset-[1px] rounded-2xl
              bg-gradient-to-r from-purple-500/30 via-indigo-500/20 to-blue-500/30
              opacity-0 group-hover:opacity-100 blur-lg transition duration-500" />

            {/* Glass Card */}
            <div className="relative rounded-2xl p-8 space-y-5
              bg-gradient-to-br from-white/12 via-white/6 to-white/12
              backdrop-blur-2xl
              border border-white/20
              shadow-[0_25px_70px_rgba(0,0,0,0.45)]
              transition-all duration-500">

              {/* Glass highlight */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl
                bg-gradient-to-tr from-white/40 via-transparent to-transparent
                opacity-15" />

              <div className="text-indigo-400 text-sm font-semibold tracking-widest">
                METHOD 03
              </div>

              <h3 className="text-xl font-semibold">
                Image to Quiz
              </h3>

              <p className="text-gray-400 leading-relaxed ">
                Upload images containing questions. Automatically extract and
                  convert them into editable quiz format.
              </p>
            </div>
          </motion.div>
            </div>

            {/* ================= Workflow Steps ================= */}
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "STEP 01",
                  title: "Generate or Build",
                  desc: "Create your quiz using manual entry, AI generation, or image extraction.",
                },
                {
                  step: "STEP 02",
                  title: "Preview & Review",
                  desc: "Review the generated output. Continue if satisfied or refine it manually.",
                },
                {
                  step: "STEP 03",
                  title: "Edit & Configure",
                  desc: "Adjust questions and configure timer, retries, security, and randomisation.",
                },
                {
                  step: "STEP 04",
                  title: "Share & Track",
                  desc: "Deploy via secure link and monitor attempts, scores, and activity signals.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{
                    y: -6,
                    transition: { type: "spring", stiffness: 220 }
                  }}
                  className="relative group"
                >

                  {/* Hover Glow */}
                  <div className="absolute -inset-[1px] rounded-2xl
                    bg-gradient-to-r from-purple-500/30 via-indigo-500/20 to-blue-500/30
                    opacity-0 group-hover:opacity-100 blur-lg transition duration-500" />

                  {/* Glass Card */}
                  <div className="relative rounded-2xl p-6 space-y-3
                    bg-gradient-to-br from-white/12 via-white/6 to-white/12
                    backdrop-blur-2xl
                    border border-white/20
                    shadow-[0_25px_70px_rgba(0,0,0,0.45)]
                    transition-all duration-500">

                    {/* Glass highlight */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl
                      bg-gradient-to-tr from-white/40 via-transparent to-transparent
                      opacity-15" />

                    <div className="text-indigo-400 text-xs font-semibold tracking-widest">
                      {item.step}
                    </div>

                    <h4 className="font-semibold">
                      {item.title}
                    </h4>

                    <p className="text-gray-400 text-sm leading-relaxed">
                      {item.desc}
                    </p>

                  </div>
                </motion.div>
              ))}
            </div>
          </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="container py-28 text-center text-white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            whileHover={{
              y: -6,
              transition: { type: "spring", stiffness: 220 }
            }}
            className="relative group rounded-3xl"
          >

            {/* Hover Glow */}
            <div className="absolute -inset-[1px] rounded-3xl
              bg-gradient-to-r from-purple-500/30 via-indigo-500/20 to-blue-500/30
              opacity-0 group-hover:opacity-100 blur-xl transition duration-500" />

            {/* Glass Card */}
            <div className="relative rounded-3xl p-12
              bg-gradient-to-br from-white/12 via-white/6 to-white/12
              backdrop-blur-2xl
              border border-white/20
              shadow-[0_25px_70px_rgba(0,0,0,0.45)]
              transition-all duration-500">

              {/* Glass highlight */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl
                bg-gradient-to-tr from-white/40 via-transparent to-transparent
                opacity-15" />

              <h2 className="text-4xl font-bold mb-6">
                Build Secure Quizzes with Confidence
              </h2>

              <p className="text-gray-400 mb-10 leading-relaxed">
                Create assessments manually, generate them with AI,
                or convert images into structured quizzes —
                then deploy with full control over timing and security.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate(user ? "/dashboard" : "/auth")}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600
                    hover:from-purple-700 hover:to-indigo-700
                    text-white px-8 shadow-lg shadow-purple-500/30 text-lg py-6"
                >
                  {user ? "Go to Dashboard" : "Start Building"}
                </Button>
              </div>

            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
