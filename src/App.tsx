import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Phone, 
  Send, 
  Clock, 
  Smartphone, 
  Lock, 
  Download, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Compass,
  Copy,
  MessageSquare
} from "lucide-react";

// Types
interface ISTTimeInfo {
  day: number;
  dayString: string;
  monthString: string;
  yearString: string;
  timeString: string;
  fullString: string;
}

export default function App() {
  // Mobile Number State (as typed by user)
  const [mobileNumber, setMobileNumber] = useState("");
  // Generated OTP Cache
  const [generatedOtp, setGeneratedOtp] = useState("");
  // Tracking if user opened SMS
  const [smsTriggered, setSmsTriggered] = useState(false);
  // Tracking if user opened WhatsApp
  const [whatsappTriggered, setWhatsappTriggered] = useState(false);
  // Real-time IST date/time info
  const [istTime, setIstTime] = useState<ISTTimeInfo | null>(null);
  // Accordion status for Formula breakdown
  const [showBreakdown, setShowBreakdown] = useState(false);
  // For PWA dynamic install prompts
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  // Copy confirmation state
  const [copied, setCopied] = useState(false);
  const [otpCopied, setOtpCopied] = useState(false);

  // Establish India Standard Time clock & keep it ticking
  useEffect(() => {
    const calculateIST = () => {
      try {
        const now = new Date();
        
        const dayVal = new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "numeric"
        }).format(now);

        const monthVal = new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          month: "long"
        }).format(now);

        const yearVal = new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          year: "numeric"
        }).format(now);

        const timeVal = new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        }).format(now);

        setIstTime({
          day: parseInt(dayVal, 10),
          dayString: dayVal,
          monthString: monthVal,
          yearString: yearVal,
          timeString: timeVal,
          fullString: `${dayVal} ${monthVal} ${yearVal}, ${timeVal}`
        });
      } catch (err) {
        console.error("Error calculating India Standard Time: ", err);
      }
    };

    calculateIST();
    const interval = setInterval(calculateIST, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track PWA install capability
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReadyToInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Utility to count digits in string
  const getDigitsOnly = (input: string) => input.replace(/\D/g, "");

  const digits = getDigitsOnly(mobileNumber);
  const hasMinFourDigits = digits.length >= 4;
  const lastFour = hasMinFourDigits ? digits.slice(-4) : "";
  const reversedLastFour = hasMinFourDigits ? lastFour.split("").reverse().join("") : "";

  // Dynamic OTP calculation
  const indianDayValue = istTime?.day ?? new Date().getDate(); 
  const calculationSteps = hasMinFourDigits ? reversedLastFour.split("").map((char) => {
    const num = parseInt(char, 10);
    const sum = num + indianDayValue;
    const finalDigit = sum % 10;
    return {
      original: num,
      plusDay: sum,
      modulo: finalDigit
    };
  }) : [];

  const currentOtp = calculationSteps.length === 4 
    ? calculationSteps.map(step => step.modulo).join("") 
    : "";

  useEffect(() => {
    setGeneratedOtp(currentOtp);
    if (smsTriggered) setSmsTriggered(false);
    if (whatsappTriggered) setWhatsappTriggered(false);
  }, [currentOtp]);

  // Trigger Native PWA installation
  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setIsReadyToInstall(false);
    }
    setDeferredPrompt(null);
  };

  // Open native SMS with the exact template requested
  const handleSendOtp = () => {
    if (!hasMinFourDigits) return;
    
    const smsMessage = `Your Taxi OTP is: ${generatedOtp}\nYour booking is CONFIRMED!\nShare this OTP with the driver to begin your ride.`;
    const cleanNumber = digits; 

    const encodedSmsBody = encodeURIComponent(smsMessage);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    const smsUrl = isIOS 
      ? `sms:${cleanNumber}&body=${encodedSmsBody}`
      : `sms:${cleanNumber}?body=${encodedSmsBody}`;

    setSmsTriggered(true);
    window.location.href = smsUrl;
  };

  // Open WhatsApp directly with prefilled message
  const handleSendWhatsApp = () => {
    if (!hasMinFourDigits) return;

    const whatsappMessage = `Your Taxi OTP is: ${generatedOtp}\nYour booking is CONFIRMED!\nShare this OTP with the driver to begin your ride.`;
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // For standard Indian numbers (10 digits), prepend '91' country code to facilitate direct API launching
    let cleanNumber = digits;
    if (cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    setWhatsappTriggered(true);
    window.open(whatsappUrl, "_blank");
  };

  // Copy SMS content to clipboard as fallback/review capability
  const handleCopyOtpMessage = () => {
    const smsMessage = `Your Taxi OTP is: ${generatedOtp}\nYour booking is CONFIRMED!\nShare this OTP with the driver to begin your ride.`;
    navigator.clipboard.writeText(smsMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Copy ONLY the 4-digit generated OTP
  const handleCopyOnlyOtp = () => {
    if (!generatedOtp) return;
    navigator.clipboard.writeText(generatedOtp).then(() => {
      setOtpCopied(true);
      setTimeout(() => setOtpCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between py-8 px-4 md:px-8 font-sans antialiased">
      {/* Subtle decorative warm ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-45">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-amber-100/30 blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-yellow-100/30 blur-[100px]" />
      </div>

      {/* Container wrapper for neat bento / responsive sizing */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center space-y-6 relative z-10">
        
        {/* Header - Brand Cockpit */}
        <header className="text-center space-y-3">
          <div className="text-center">
            <h1 id="app-title" className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent uppercase">
              Taxi OTP dispatch
            </h1>
            <p className="text-[11px] text-slate-400 font-mono tracking-widest font-semibold uppercase mt-1">Trusty Yellow Cab</p>
          </div>

          {/* Timezone Indicator Card - ALWAYS India Standard Time */}
          <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-xs border border-slate-200/60 px-4.5 py-2 rounded-full text-xs text-slate-600 mt-2 font-mono shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>IST (Date: <span className="font-bold text-amber-600">{istTime?.dayString || "Syncing..."}</span>): </span>
            <span className="text-slate-800 font-bold">{istTime?.timeString || "Syncing..."}</span>
          </div>
        </header>

        {/* Dynamic PWA Installer Alert banner */}
        <AnimatePresence>
          {isReadyToInstall && !isInstalled && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-slate-200 border-l-4 border-l-amber-500 p-4 rounded-2xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-amber-500/10 p-2 rounded-xl text-amber-600">
                  <Download className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Install to Mobile Screen</h3>
                  <p className="text-[10px] text-slate-500 font-sans leading-normal">Runs fast & works completely offline.</p>
                </div>
              </div>
              <button 
                onClick={handlePwaInstall}
                className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-xs"
              >
                INSTALL
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Master Dispatch Panel / Card */}
        <main className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.03)] space-y-6 relative overflow-hidden">
          
          {/* Form Fields: Customer Mobile Number Input */}
          <div className="space-y-2">
            <label htmlFor="customer-mobile" className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>Customer Mobile Number</span>
              </span>
              {digits.length > 0 && (
                <span className="text-xs font-mono text-slate-400 font-semibold">
                  {digits.length} Digit{digits.length !== 1 ? "s" : ""}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                id="customer-mobile"
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder=""
                className="w-full bg-slate-50/80 border border-slate-200/60 rounded-2xl px-5 py-4.5 pr-12 text-xl font-mono tracking-widest focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-slate-900 transition-all font-bold shadow-xs"
                autoComplete="off"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                {digits.length >= 10 ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                ) : digits.length > 0 ? (
                  <AlertCircle className="w-5 h-5 text-amber-500 fill-amber-50" />
                ) : null}
              </div>
            </div>

            {/* Validation & helper guides */}
            <div className="flex justify-between items-center text-xs">
              <span></span>
              {digits.length > 0 && digits.length < 4 && (
                <span className="text-amber-600 font-semibold font-mono">Requires min 4 digits for OTP</span>
              )}
            </div>
          </div>

          {/* Dynamic OTP Live Display */}
          <div className="bg-slate-50/70 border border-slate-100 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
            <div className="absolute top-3 left-3 flex items-center space-x-1.5 text-[9px] font-mono tracking-wider font-bold text-slate-400 uppercase">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>LIVE OTP ENGINE</span>
            </div>

            {hasMinFourDigits && (
              <button 
                onClick={handleCopyOnlyOtp}
                title="Copy calculated OTP to clipboard"
                className="absolute top-2.5 right-2.5 flex items-center space-x-1 text-[11px] text-amber-700 hover:text-amber-800 font-mono px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 active:scale-95 transition-all shadow-xs"
              >
                <Copy className="w-3 h-3" />
                <span>{otpCopied ? "Copied!" : "Copy OTP"}</span>
              </button>
            )}

            {hasMinFourDigits ? (
              <div className="w-full text-center space-y-3 mt-4">
                <span className="text-xs text-slate-400 uppercase font-mono tracking-wider font-semibold">Calculated Taxi OTP</span>
                <div className="flex justify-center space-x-3 py-1">
                  {generatedOtp.split("").map((digit, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: idx * 0.05 }}
                      className="w-14 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-3xl font-black font-mono text-amber-600 shadow-[0_4px_12px_rgba(245,158,11,0.06)] cursor-pointer hover:border-amber-500 hover:scale-105 active:scale-95 transition-all"
                      onClick={handleCopyOnlyOtp}
                      title="Click to copy OTP"
                    >
                      {digit}
                    </motion.div>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 font-semibold">
                  Based on India Calendar Day: <span className="font-bold text-slate-600">{indianDayValue}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2 text-slate-400">
                <Lock className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p className="text-sm font-bold text-slate-700">OTP Calculation Idle</p>
                <p className="text-[11px] leading-relaxed max-w-xs mx-auto text-slate-400">Please input at least 4 digits of the mobile number to generate a secure ride verification OTP.</p>
              </div>
            )}
          </div>

          {/* Action Buttons: Responsive Grid layout for modern touch-targets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Primary Action Button - Opens Native SMS Client */}
            <button
              onClick={handleSendOtp}
              disabled={!hasMinFourDigits}
              className={`py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center space-x-2.5 transition-all duration-200 transform active:scale-95 ${
                hasMinFourDigits
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black shadow-[0_4px_20px_rgba(245,158,11,0.22)] cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60"
              }`}
            >
              <Send className="w-5 h-5 fill-current" />
              <span>SEND SMS</span>
            </button>

            {/* WhatsApp Direct Dispatch Button */}
            <button
              onClick={handleSendWhatsApp}
              disabled={!hasMinFourDigits}
              className={`py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center space-x-2.5 transition-all duration-200 transform active:scale-95 ${
                hasMinFourDigits
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-[0_4px_20px_rgba(16,185,129,0.22)] cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>WHATSAPP</span>
            </button>
          </div>

          {/* User manual trigger tracker helper */}
          {smsTriggered && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-xs text-center text-emerald-700 font-mono leading-relaxed"
            >
               SMS application opened! Press SEND inside your mobile message app to share the prefilled OTP with the driver.
            </motion.div>
          )}

          {whatsappTriggered && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-xs text-center text-emerald-700 font-mono leading-relaxed"
            >
               WhatsApp opened! Send the prefilled message in the chat to share the OTP with the driver.
            </motion.div>
          )}

          {/* Optional fallback helper: Live Message Preview */}
          {hasMinFourDigits && (
            <div className="border border-slate-200/60 bg-slate-50/50 rounded-2xl p-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400 font-sans tracking-wider uppercase text-[9px] font-bold">Prefilled SMS Message</span>
                <button 
                  onClick={handleCopyOtpMessage} 
                  className="text-amber-700 hover:text-amber-800 font-mono text-xs flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied!" : "Copy SMS"}</span>
                </button>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 text-xs font-mono text-slate-700 break-all whitespace-pre-wrap shadow-xs leading-relaxed">
                Your Taxi OTP is: <span className="text-amber-600 font-extrabold">{generatedOtp}</span>
                {"\n"}Your booking is CONFIRMED!
                {"\n"}Share this OTP with the driver to begin your ride.
              </div>
            </div>
          )}

        </main>

        {/* Accordion Block A: Exact OTP Algorithm visual formula breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between p-4 text-xs text-slate-600 hover:text-slate-800 transition-colors focus:outline-none"
          >
            <span className="flex items-center space-x-2 font-mono text-slate-500 font-bold">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>LIVE ALGORITHM CALCULATIONS</span>
            </span>
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <AnimatePresence>
            {showBreakdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="border-t border-slate-200 bg-slate-50/50 p-5 text-xs space-y-4 font-mono text-slate-600 overflow-hidden"
              >
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="text-amber-700 font-bold mb-1 font-sans text-xs">Formula Definition:</div>
                  <div className="text-slate-700 bg-slate-50 p-2 rounded-lg inline-block text-[11px] font-mono border border-slate-100">
                    OTP Digit = (Reversed Digit + TodayDay) % 10
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-200 pb-1 font-sans font-semibold tracking-wide uppercase">
                    <span>Active Trace Breakdown</span>
                    <span className="bg-amber-100 border border-amber-200 px-2 py-0.5 rounded text-[10px] text-amber-800">IST Day: {indianDayValue}</span>
                  </div>

                  {hasMinFourDigits ? (
                    <div className="space-y-2.5 text-slate-600">
                      <div className="flex justify-between text-[11px]">
                        <span>Last 4 Digits selected:</span>
                        <span className="text-slate-800 font-bold">{lastFour}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Digits Reversed (R):</span>
                        <span className="text-slate-800 font-bold select-all bg-slate-100 px-1.5 py-0.2 rounded">{reversedLastFour}</span>
                      </div>
                      <div className="pt-1 text-[10px] text-slate-400 font-sans tracking-wider uppercase font-bold">Live Addition Steps:</div>
                      
                      <div className="grid grid-cols-4 gap-2 text-center mt-1">
                        {calculationSteps.map((step, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs">
                            <div className="text-slate-400 text-[9px] font-sans font-semibold">Pos #{idx+1}</div>
                            <div className="text-slate-800 font-black text-sm">{step.original}</div>
                            <div className="text-[10px] text-slate-400 font-light">+{indianDayValue}</div>
                            <div className="text-[10px] text-slate-400">= {step.plusDay}</div>
                            <div className="text-amber-600 font-black text-sm mt-0.5 pt-0.5 border-t border-slate-100">
                              {step.modulo}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 bg-white p-3 rounded-xl shadow-xs">
                        <span className="text-slate-700 font-semibold text-xs font-sans">Final Generated OTP:</span>
                        <span className="text-amber-600 font-black text-base tracking-widest bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">{generatedOtp}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-center py-2 italic text-xs font-sans">
                      Enter a customer mobile number to trace live formulas.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer / Transparency Status Bar */}
      <footer className="w-full max-w-lg mx-auto mt-8 border-t border-slate-200/80 pt-4 text-center space-y-2">
        <p className="text-[9px] text-slate-400 leading-normal max-w-xs mx-auto font-sans">
          Generates India Standard Time (IST/Kolkata) calendar-synced verification keys completely offline on your device storage safely.
        </p>
      </footer>
    </div>
  );
}
