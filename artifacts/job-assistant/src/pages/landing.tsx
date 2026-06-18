import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Target, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50">
      <header className="px-6 lg:px-8 h-16 flex items-center border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Target className="w-6 h-6" />
          Job Scout Pro AI
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-2">
            Sign In
          </Link>
          <Link href="/sign-up" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <div className="flex flex-col items-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl text-slate-900">
                Land the right job, <br className="hidden sm:inline" />
                <span className="text-primary">faster and smarter.</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-slate-600 md:text-xl/relaxed lg:text-2xl/relaxed">
                Your personal AI career strategist. Score jobs against your resume, generate tailored cover letters, and track your applications with precision.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link href="/sign-up" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                  Start Scouting For Free <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <Brain className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Resume Matching</h3>
                <p className="text-slate-600">See exactly how well your resume matches any job description. Identify missing keywords instantly.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">AI Cover Letters</h3>
                <p className="text-slate-600">Generate highly tailored cover letters and recruiter messages based on your specific experience and the job's needs.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Application Tracking</h3>
                <p className="text-slate-600">Stop using messy spreadsheets. Track every application from saved to offer in one clean interface.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 md:py-8 bg-white">
        <div className="container flex flex-col md:flex-row items-center justify-center gap-4 px-4 md:px-6 mx-auto text-center md:text-left text-sm text-slate-500">
          <p>© 2025 Job Scout Pro AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}