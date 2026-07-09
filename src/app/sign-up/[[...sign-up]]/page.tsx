import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="h-screen w-full relative overflow-hidden flex items-center justify-center bg-neutral-900">
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/AskAu/aucampus.avif')" }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>
      
      <div className="relative z-10 p-6 flex flex-col items-center w-full max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-3 shadow-2xl mb-6">
          <img src="/AskAu/aulogo.png" alt="AU Logo" className="w-full h-full object-contain" />
        </div>
        <div className="w-full">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] rounded-3xl",
                card: "bg-[#1F3A5F]/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full",
                headerTitle: "text-white font-extrabold text-2xl tracking-tight",
                headerSubtitle: "text-[#DB96A1] font-semibold text-sm",
                socialButtonsBlockButton: "border border-white/20 hover:bg-white/10 text-white transition-all",
                socialButtonsBlockButtonText: "text-white font-semibold",
                dividerLine: "bg-white/20",
                dividerText: "text-white/50",
                formFieldLabel: "text-[#DB96A1] font-bold text-xs uppercase tracking-widest",
                formFieldInput: "bg-black/40 border border-white/20 text-white placeholder-white/40 focus:border-[#C41E3A] rounded-xl outline-none",
                formButtonPrimary: "bg-[#C41E3A] hover:bg-[#A31830] text-white rounded-xl shadow-[0_0_15px_rgba(196,30,58,0.4)] transition-all font-bold",
                footerActionText: "text-white/70",
                footerActionLink: "text-[#C41E3A] hover:text-[#DB96A1] font-bold",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-[#C41E3A] hover:text-[#DB96A1]",
                formFieldInputShowPasswordButton: "text-white/50 hover:text-white"
              },
              variables: {
                colorPrimary: "#C41E3A",
                colorBackground: "transparent",
              }
            }}
          />
        </div>
      </div>
    </main>
  )
}
