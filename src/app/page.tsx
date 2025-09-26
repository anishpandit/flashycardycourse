import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <SignedOut>
          <div className="text-center space-y-8 py-16">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Welcome to Flashy Cardy Course
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Master any subject with our interactive flashcard learning platform. 
                Sign up to create, share, and study with powerful spaced repetition techniques.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <div className="text-3xl mb-4">🧠</div>
                <h3 className="text-lg font-semibold mb-2">Smart Learning</h3>
                <p className="text-gray-400">AI-powered spaced repetition helps you learn more efficiently</p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <div className="text-3xl mb-4">📚</div>
                <h3 className="text-lg font-semibold mb-2">Rich Content</h3>
                <p className="text-gray-400">Create flashcards with text, images, and multimedia</p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <div className="text-3xl mb-4">👥</div>
                <h3 className="text-lg font-semibold mb-2">Collaborative</h3>
                <p className="text-gray-400">Share decks and study together with your peers</p>
              </div>
            </div>
            
            <div className="pt-8">
              <p className="text-gray-400 mb-4">Ready to supercharge your learning?</p>
              <p className="text-sm text-gray-500">Sign up or sign in using the buttons in the header above</p>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="space-y-8 py-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold">Welcome back!</h1>
              <p className="text-gray-300">Ready to continue your learning journey?</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-600/20 border border-blue-500/30 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Create New Deck</h3>
                <p className="text-gray-300 mb-4">Start building your next flashcard collection</p>
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                  Get Started
                </button>
              </div>
              
              <div className="bg-green-600/20 border border-green-500/30 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Continue Studying</h3>
                <p className="text-gray-300 mb-4">Review your existing flashcard decks</p>
                <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors">
                  Study Now
                </button>
              </div>
              
              <div className="bg-purple-600/20 border border-purple-500/30 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Browse Library</h3>
                <p className="text-gray-300 mb-4">Discover decks shared by the community</p>
                <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
                  Explore
                </button>
              </div>
            </div>
            
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Your Progress Today</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">0</div>
                  <div className="text-sm text-gray-400">Cards Studied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">0</div>
                  <div className="text-sm text-gray-400">Correct Answers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">0</div>
                  <div className="text-sm text-gray-400">Study Streak</div>
                </div>
              </div>
            </div>
          </div>
        </SignedIn>
      </main>
    </div>
  );
}
