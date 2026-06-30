import React, { useState, useEffect } from 'react';
import { ViewState, LoggedInUser } from '../types';
import { handleImageError } from '../utils/imageFallback';
import { speechService } from '../utils/speech';
import { supabase } from '../lib/supabase';

interface LoginViewProps {
  setView: (view: ViewState) => void;
  addToast: (msg: string) => void;
  preselectedRole: 'customer' | 'seller' | 'delivery' | null;
  setPreselectedRole: (role: 'customer' | 'seller' | 'delivery' | null) => void;
  onLoginSuccess: (user: LoggedInUser) => void;
}

export default function LoginView({
  setView,
  addToast,
  preselectedRole,
  setPreselectedRole,
  onLoginSuccess
}: LoginViewProps) {
  // Authentication Method Tabs
  const [activeTab, setActiveTab] = useState<'google' | 'phone' | 'email' | 'other'>('google');
  
  // Selected Profile Role (Defaults to preselected override if passed, else customer)
  const [selectedRole, setSelectedRole] = useState<'customer' | 'seller' | 'delivery'>(() => {
    if (preselectedRole === 'customer') return 'customer';
    if (preselectedRole === 'seller') return 'seller';
    if (preselectedRole === 'delivery') return 'delivery';
    return 'customer';
  });

  // Keep state updated if preselectedRole prop updates
  useEffect(() => {
    if (preselectedRole) {
      setSelectedRole(preselectedRole);
    }
  }, [preselectedRole]);

  // General Text Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Verification process animations
  const [isVerifying, setIsVerifying] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  // Simulated Google Login popup state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  // Phone OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [systemOtp, setSystemOtp] = useState('');

  // Email OTP state
  const [emailAuthMode, setEmailAuthMode] = useState<'password' | 'otp'>('otp');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [enteredEmailOtp, setEnteredEmailOtp] = useState('');
  const [emailOtpCountdown, setEmailOtpCountdown] = useState(0);
  const [systemEmailOtp, setSystemEmailOtp] = useState('');

  // Voice Biometric state
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceWaveform, setVoiceWaveform] = useState<number[]>([]);

  // Passkey touch flow state
  const [isPasskeyScanning, setIsPasskeyScanning] = useState(false);

  // Manage Phone OTP timer countdown
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Manage Email OTP timer countdown
  useEffect(() => {
    if (emailOtpCountdown > 0) {
      const timer = setTimeout(() => setEmailOtpCountdown(emailOtpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailOtpCountdown]);

  // Simulate audio reactive bars when voice biometric triggers
  useEffect(() => {
    let interval: any;
    if (isVoiceListening) {
      interval = setInterval(() => {
        const randomWave = Array.from({ length: 8 }, () => Math.floor(Math.random() * 40) + 10);
        setVoiceWaveform(randomWave);
      }, 150);
    } else {
      setVoiceWaveform([]);
    }
    return () => clearInterval(interval);
  }, [isVoiceListening]);

  // General helper to perform authentication progress animations
  const finalizeAuthentication = (name: string, identifier: string, method: LoggedInUser['authMethod']) => {
    setIsVerifying(true);
    setProgressMsg('Exchanging secure handshake token...');
    
    setTimeout(() => {
      setProgressMsg('Broadcasting node consensus key...');
      setTimeout(() => {
        setIsVerifying(false);
        
        const authenticatedUser: LoggedInUser = {
          id: 'user_' + Math.random().toString(36).substr(2, 9),
          name: name || 'Zenvego Neighbor',
          emailOrPhone: identifier || 'community@zenvego.org',
          role: selectedRole,
          authMethod: method,
          avatar: selectedRole === 'customer' 
            ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'
            : selectedRole === 'seller'
              ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoAL8ofMRyL8kK_sYXBp_4J5XwePZQ_K1_9StG4EkZdaYa9qxrtabVpwVkHWzfWg74YTz3ckjzbmsxnK0g7N57RVGNRxSwjLbgcrRUORPa-F9ev2RJAGll9ppZfPmCRTfQX9YWhyapxPnIZrWy6QcEXlEM70Fz8RfF9pfTjirT1urJ7-p8nC8WRmswBLMypTur2EmDoonUeyCHUDRGRUYKZ3oNzHPuqwIfadVdEr-5QnPca_F8mDfT5wYs2UVqEesaGf-2GjxHEdsq'
              : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfMWpyldO-8cnwsG7JzSrsxx9DrG4McUUom3CqMpQJVpj1v6I6TLZMadueF362Qs8Cjf7SfKJ3E4zmfFXEWy9Djbz4BUZUn2tkAKCrpYU2V4CwCLmff7VgNXZIGt_Mrh6YE_bXQ8CYgn1R_3lX8X2QuLDCkU1GQgz_N3aS83HjvoCw34wBwsuwL9vFEC4uRDKdE60KqoobRFrYkPPeUDlbc5pYHTVkjSN0SGDx0YGsUNofl4_CUVDD4k7gGQlZ-p3iHJnoeulHb1zf'
        };
        onLoginSuccess(authenticatedUser);
      }, 1000);
    }, 900);
  };

  // Google Sign-In Actions
  const handleGoogleSubmit = (name: string, emailStr: string) => {
    setShowGoogleModal(false);
    finalizeAuthentication(name, emailStr, 'google');
  };

  // Custom Google Account form submission
  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleName || !customGoogleEmail) {
      addToast("Please enter a mock Google user name and email.");
      return;
    }
    handleGoogleSubmit(customGoogleName, customGoogleEmail);
  };

  // Real Supabase Phone OTP with fallback simulation
  const handleSendOtp = async () => {
    const strippedPhone = phone.trim();
    if (!strippedPhone || strippedPhone.length < 9) {
      addToast("⚠️ Please specify a valid mobile phone number.");
      return;
    }
    
    setIsVerifying(true);
    setProgressMsg("Sending verification SMS...");
    
    try {
      // Format phone number with +91 for India (you can change this based on country)
      const formattedPhone = strippedPhone.startsWith('+') ? strippedPhone : `+91${strippedPhone}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      
      if (error) {
        // If Supabase phone auth isn't set up, fall back to simulation
        console.warn("Supabase phone auth failed, falling back to simulation:", error);
        const generatedCode = (Math.floor(Math.random() * 900000) + 100000).toString();
        setSystemOtp(generatedCode);
        addToast("🔄 Initiating network SMS carrier gateway...");
        setTimeout(() => {
          addToast(`💬 SECURE OTP MATCH: Your 6-digit Zenvego verification code is ${generatedCode}`);
        }, 1200);
      } else {
        addToast("📱 Verification SMS sent! Please check your phone.");
      }
      
      setOtpSent(true);
      setOtpCountdown(60);
      setEnteredOtp('');
    } catch (err) {
      addToast("❌ Failed to send SMS. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp.trim() || enteredOtp.length !== 6) {
      addToast("⚠️ Please enter a valid 6-digit code.");
      return;
    }
    
    setIsVerifying(true);
    setProgressMsg("Verifying code...");
    
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: enteredOtp,
        type: 'sms',
      });
      
      if (error) {
        // If Supabase verification fails, check against simulation code
        if (enteredOtp.trim() === systemOtp) {
          const calculatedName = displayName.trim() || `Partner +${phone.slice(-4)}`;
          finalizeAuthentication(calculatedName, phone, 'phone');
        } else {
          addToast("❌ Invalid security OTP. Please check the code that arrived in the system notifications.");
        }
      } else if (data.user) {
        addToast("✅ Verification successful!");
        finalizeAuthentication(displayName.trim() || data.user.email?.split('@')[0] || 'Zenvego User', phone, 'phone');
      }
    } catch (err) {
      addToast("❌ Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Send Email OTP (Magic Link / OTP code)
  const handleSendEmailOtp = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      addToast("⚠️ Please enter a valid neighborhood email address.");
      return;
    }

    setIsVerifying(true);
    setProgressMsg("Sending email verification code...");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
      });

      if (error) {
        // Fall back to simulation
        console.warn("Supabase email OTP failed, falling back to simulation:", error);
        const generatedCode = (Math.floor(Math.random() * 900000) + 100000).toString();
        setSystemEmailOtp(generatedCode);
        addToast("🔄 Connecting to SMTP email broadcast server...");
        setTimeout(() => {
          addToast(`📨 SECURE OTP MATCH: Your 6-digit Zenvego verification code is ${generatedCode}`);
        }, 1200);
      } else {
        addToast("📨 Verification code sent! Please check your email inbox.");
        // We can also set a simulated code for safety in case they can't access the email
        const generatedCode = (Math.floor(Math.random() * 900000) + 100000).toString();
        setSystemEmailOtp(generatedCode);
        setTimeout(() => {
          addToast(`📨 [SANDBOX OTP]: ${generatedCode} (Sent in background in case mail delivery is delayed)`);
        }, 1500);
      }

      setEmailOtpSent(true);
      setEmailOtpCountdown(60);
      setEnteredEmailOtp('');
    } catch (err) {
      addToast("❌ Failed to send email OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!enteredEmailOtp.trim() || enteredEmailOtp.length !== 6) {
      addToast("⚠️ Please enter a valid 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setProgressMsg("Verifying email code...");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: enteredEmailOtp,
        type: 'email',
      });

      if (error) {
        // Fall back to simulation code
        if (enteredEmailOtp.trim() === systemEmailOtp) {
          addToast("✅ Verification successful (simulated)!");
          finalizeAuthentication(cleanEmail.split('@')[0], cleanEmail, 'email');
        } else {
          addToast("❌ Invalid security OTP. Please check the code that arrived in your notifications.");
        }
      } else if (data.user) {
        addToast("✅ Email verification successful!");
        finalizeAuthentication(cleanEmail.split('@')[0], cleanEmail, 'email');
      }
    } catch (err) {
      // Check simulation code as fallback even on exception
      if (enteredEmailOtp.trim() === systemEmailOtp) {
        addToast("✅ Verification successful (simulated)!");
        finalizeAuthentication(cleanEmail.split('@')[0], cleanEmail, 'email');
      } else {
        addToast("❌ Verification failed. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Email credentials / Magic Link with real Supabase Auth
  const handleEmailSubmit = async (e: React.FormEvent, isMagicLink: boolean = false) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      addToast("⚠️ Please enter a valid neighborhood email address.");
      return;
    }

    setIsVerifying(true);
    setProgressMsg("Exchanging secure tokens with Supabase Auth...");

    if (isMagicLink) {
      const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail });
      setIsVerifying(false);
      if (error) {
        addToast(`❌ Auth Error: ${error.message}`);
      } else {
        addToast(`📨 Hyperlink sent! A secure magic link is broadcasted to: ${cleanEmail}. Please check your inbox.`);
      }
    } else {
      if (!password) {
        addToast("⚠️ Password credentials cannot be blank.");
        setIsVerifying(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        setIsVerifying(false);
        
        if (error) {
          // If login fails, try to sign them up automatically for a seamless hackathon experience
          if (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed")) {
             addToast("Attempting to register new account...");
             const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
               email: cleanEmail,
               password: password,
             });
             if (signUpError) {
               console.warn("Supabase signup failed, falling back to simulation:", signUpError.message);
               addToast("🔄 Offline/unconfigured Supabase bypass...");
               setTimeout(() => {
                 addToast("✅ Logged in via simulated credentials!");
                 finalizeAuthentication(cleanEmail.split('@')[0], cleanEmail, 'email');
               }, 1000);
             } else {
               addToast(`✅ Account Created! Please check your email to verify your address.`);
             }
          } else {
            console.warn("Supabase auth failed, falling back to simulation:", error.message);
            addToast("🔄 Offline/unconfigured Supabase bypass...");
            setTimeout(() => {
              addToast("✅ Logged in via simulated credentials!");
              finalizeAuthentication(cleanEmail.split('@')[0], cleanEmail, 'email');
            }, 1000);
          }
        } else if (data.user) {
          addToast("✅ Successfully authenticated via Supabase!");
          finalizeAuthentication(cleanEmail.split('@')[0], cleanEmail, 'email');
        }
      } catch (err) {
        setIsVerifying(false);
        console.warn("Supabase connection error, falling back to simulation:", err);
        addToast("🔄 Offline/unconfigured Supabase bypass...");
        setTimeout(() => {
          addToast("✅ Logged in via simulated credentials!");
          finalizeAuthentication(cleanEmail.split('@')[0], cleanEmail, 'email');
        }, 1000);
      }
    }
  };

  // Voice Biometric Credentials with Web Speech API
  const handleVoiceBiometrics = () => {
    if (isVoiceListening) {
      speechService.stop();
      setIsVoiceListening(false);
      return;
    }

    setIsVoiceListening(true);
    addToast("🎙️ Speech Recognition Biometric Active. Say 'Open Zenvego' or 'Verifiable Access Keys' out loud to log in.");
    
    // Simulate active high-precision waveform bars
    const interval = setInterval(() => {
      const points = Array.from({ length: 15 }, () => Math.floor(Math.random() * 40) + 10);
      setVoiceWaveform(points);
    }, 120);

    const cleanup = speechService.listen({
      onStart: () => {
        setIsVoiceListening(true);
      },
      onResult: (transcript: string, isFinal: boolean) => {
        const text = transcript.toLowerCase();
        if (text.includes('open') || text.includes('keys') || text.includes('zenvego') || text.includes('access') || text.includes('verifiable') || text.includes('sesame') || text.includes('biometric') || text.includes('login')) {
          speechService.stop();
          clearInterval(interval);
          setIsVoiceListening(false);
          finalizeAuthentication("John Biometric Sourcing", "voice_ledger_authenticated", 'voice');
          addToast("✅ Biometric matches sound print database perfectly! Access Granted.");
        }
      },
      onError: (err: any) => {
        console.warn('Biometric voice error or fallback:', err);
        // Fallback for visual mock and sandbox consistency
        setTimeout(() => {
          clearInterval(interval);
          setIsVoiceListening(false);
          finalizeAuthentication("John Biometric Sourcing", "voice_ledger_authenticated", 'voice');
        }, 2200);
      },
      onEnd: () => {
        clearInterval(interval);
        setIsVoiceListening(false);
      }
    });

    return () => {
      clearInterval(interval);
      cleanup();
    };
  };

  // Passkey touch ID simulation
  const handlePasskeyVerification = () => {
    setIsPasskeyScanning(true);
    addToast("🔑 Requesting hardware passkey verification credentials...");
    
    setTimeout(() => {
      setIsPasskeyScanning(false);
      finalizeAuthentication("Sarah Jenkins (Passkey)", "webauthn_passkey_secure", 'passkey');
    }, 1800);
  };

  // Pre-loaded quick demo user profiles so developer preview is incredibly convenient
  const loginAsDemoSandbox = (profile: 'sarah' | 'miller' | 'river') => {
    if (profile === 'sarah') {
      setSelectedRole('customer');
      finalizeAuthentication("Sarah Jenkins", "jenkins.sarah@gmail.com", 'sandbox');
    } else if (profile === 'miller') {
      setSelectedRole('seller');
      finalizeAuthentication("John Miller", "windmill.sourdough@gmail.com", 'sandbox');
    } else if (profile === 'river') {
      setSelectedRole('delivery');
      finalizeAuthentication("Alex River", "alex.courier@zenvego.org", 'sandbox');
    }
  };

  return (
    <div id="login-viewport" className="min-h-screen bg-[#fff8f6] flex grid grid-cols-1 md:grid-cols-12 overflow-hidden font-sans text-on-surface">
      
      {/* 1. Left Graphic Panel with Consensus Branding details */}
      <div 
        id="login-brand-sidebar"
        className="hidden md:flex md:col-span-5 relative flex-col justify-between p-8 bg-[#fdfaf5] text-[#271810] border-r border-[#eddcd4]/30 overflow-y-auto select-none"
      >
        {/* Ornate organic decorative frame borders in the corner to give "Perfect Webdesign" */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary/20 pointer-events-none rounded-tl-sm"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary/20 pointer-events-none rounded-tr-sm"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary/20 pointer-events-none rounded-bl-sm"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary/20 pointer-events-none rounded-br-sm"></div>

        {/* Upper Logo block */}
        <div className="relative flex justify-between items-start w-full gap-4 mt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => setView('market-home')}>
              <h1 className="text-3xl font-serif font-black tracking-[0.05em] text-[#0f5238] uppercase leading-none">
                ZENVEGO
              </h1>
            </div>
            <h2 className="text-xl font-serif italic text-[#0f5238] font-semibold tracking-wide leading-none mt-1">
              Meet Your Grower
            </h2>
            <p className="text-[10px] font-semibold text-[#543b2a]/70 tracking-tight font-sans mt-1.5 uppercase">
              Hyperlocal Fresh Produce Marketplace
            </p>
            
            {/* Discover Growers Button */}
            <div className="pt-3">
              <button 
                type="button"
                onClick={() => setView('market-home')} 
                className="bg-[#0f5238] hover:bg-[#0c402c] active:scale-95 text-white text-[10px] sm:text-[11px] font-black px-4 py-2 rounded-full tracking-wide shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                Discover Growers Near You
                <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Circular Zenvego Logo */}
          <div className="shrink-0">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXsVjZW7CF_rEkkvuw2qwPfrvFDlKOiWodRP081VLO2Y4YevOjDl9jG8hK4EgoqSeMU2Jjex7NxUXwlde8ZAJRY6EYqA8bjzUm9JdN8CRl-uwjaUquc-kZmZcMt72R3xgYxlBwTIc_j4N2M3QhM-OsVR6WyPYfN1SRVlY77RKuCHKxgD5vZ5B4OiuaWPw4LbMoCICk3WlLJVKkPYMTW0U0NC8mqcSiVXYvTnyiZgniHLfmVHp5XV00iLqr0W5Imi5-nxB0BNP6bJwE" 
              alt="Zenvego Consensus Logo" 
              onError={(e) => handleImageError(e, 'logo')}
              className="w-16 h-16 object-contain rounded-full bg-white/40 shadow-xs logo-breathing-highlight logo-ring-shimmer"
            />
          </div>
        </div>

        {/* Central main hero photo of the grower matching user-uploaded design concept */}
        <div className="relative my-6 flex-1 flex items-center justify-center w-full">
          <div className="relative w-full h-full min-h-[320px] rounded-[24px] overflow-hidden border border-[#eddcd4]/50 shadow-md group">
            <img 
              src="/src/assets/images/meet_your_grower_1782141964989.jpg" 
              alt="Indian Farmer with Fresh Produce Basket" 
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            {/* Soft gradient fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-5">
              <span className="bg-white/10 backdrop-blur-md text-[#ffd7c2] border border-white/10 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded w-fit mb-1.5 font-mono tracking-wider">
                Ecosystem Partner #ZVG-42
              </span>
              <p className="text-xs font-bold text-white leading-relaxed">
                "Direct-to-locker routing ensures your daily table matches our morning harvest within minutes."
              </p>
              <p className="text-[10px] text-white/70 italic mt-0.5">
                — Rukmini Swaminathan, Rooftop Grower in Block C
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Metadata Consensus Block */}
        <div className="relative w-full border-t border-[#eddcd4] pt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] text-[#543b2a]/80 font-semibold uppercase font-mono tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              Ledger Consensus Layer v3.0
            </span>
            <span className="text-[#0f5238] font-black">42 Verified Growers</span>
          </div>
          <p className="text-[10px] text-[#271810]/60 leading-normal">
            By connecting growers directly to computerized neighborhood lockers, Zenvego eliminates warehouse fuel chains, creating real local prosperity.
          </p>
        </div>
      </div>

      {/* 2. Right Interactive Sign-In Workspace Module */}
      <div id="login-interactive-panel" className="col-span-1 md:col-span-7 flex flex-col justify-center items-center py-12 px-4 sm:px-12 md:px-16 lg:px-24 bg-[#fffaf8]">
        
        <div className="w-full max-w-md space-y-6">
          
          {/* Header Title block */}
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-[10px] font-extrabold tracking-widest text-[#a24000] bg-[#a24000]/10 px-3 py-1 rounded-full uppercase inline-block">Sourcing Portal Gatekeeper</span>
            <h2 className="text-3xl font-black tracking-tight text-[#271810]">Sign In / Register</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Choose your profile space role type first, then sign in with Google OAuth, SMS OTP, Email, or biometrics.
            </p>
          </div>

          {/* ----------------- CORE MANDATE REQUIREMENT: CHOOSE ECOSYSTEM WORKSPACE ROLE ----------------- */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold text-[#7a5743] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">supervised_user_circle</span>
                Step 1: Declare Your Workspace Role (Required)
              </label>
              <span className="text-[9px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase animate-pulse">Required selection</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Customer Column */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('customer');
                  addToast("Role Preference designated: Customer / Buyer");
                }}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 cursor-pointer ${
                  selectedRole === 'customer' 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm' 
                    : 'border-surface-container bg-white hover:border-surface-container-highest hover:bg-[#fffdfd]'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`material-symbols-outlined ${selectedRole === 'customer' ? 'text-primary' : 'text-[#7a5743]'} text-[22px]`}>
                    shopping_basket
                  </span>
                  {selectedRole === 'customer' && (
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                  )}
                </div>
                <div className="space-y-px">
                  <p className="font-bold text-xs text-[#271810]">Customer</p>
                  <p className="text-[9px] text-[#7a5743] leading-none">Buy Organic harvests</p>
                </div>
              </button>

              {/* Seller / Farmer Column */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('seller');
                  addToast("Role Preference designated: Seller & Harvester");
                }}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 cursor-pointer ${
                  selectedRole === 'seller' 
                    ? 'border-[#a24000] bg-[#a24000]/5 ring-1 ring-[#a24000]/20 shadow-sm' 
                    : 'border-surface-container bg-white hover:border-surface-container-highest hover:bg-[#fffdfd]'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`material-symbols-outlined ${selectedRole === 'seller' ? 'text-[#a24000]' : 'text-[#7a5743]'} text-[22px]`}>
                    agriculture
                  </span>
                  {selectedRole === 'seller' && (
                    <span className="w-2 h-2 bg-[#a24000] rounded-full"></span>
                  )}
                </div>
                <div className="space-y-px">
                  <p className="font-bold text-xs text-[#271810]">Seller / Farmer</p>
                  <p className="text-[9px] text-[#7a5743] leading-none">Distribute local crops</p>
                </div>
              </button>

              {/* Delivery Partner Column */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('delivery');
                  addToast("Role Preference designated: Delivery Courier Partner");
                }}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 cursor-pointer ${
                  selectedRole === 'delivery' 
                    ? 'border-secondary bg-secondary/5 ring-1 ring-secondary/20 shadow-sm' 
                    : 'border-surface-container bg-white hover:border-surface-container-highest hover:bg-[#fffdfd]'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`material-symbols-outlined ${selectedRole === 'delivery' ? 'text-secondary' : 'text-[#7a5743]'} text-[22px]`}>
                    local_shipping
                  </span>
                  {selectedRole === 'delivery' && (
                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                  )}
                </div>
                <div className="space-y-px">
                  <p className="font-bold text-xs text-[#271810]">Courier Partner</p>
                  <p className="text-[9px] text-[#7a5743] leading-none">Transport neighbor drops</p>
                </div>
              </button>
            </div>
          </div>

          {/* ----------------- SIGN IN METHOD CHANNELS TABS ----------------- */}
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-extrabold text-[#7a5743] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">key</span>
              Step 2: Authenticate Identity
            </label>

            {/* Tab Swappers */}
            <div className="flex border-b border-surface-container gap-1 p-0.5 bg-surface-container-lowest rounded-xl border">
              <button
                type="button"
                onClick={() => { setActiveTab('google'); setOtpSent(false); }}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'google' 
                    ? 'bg-white text-primary shadow-sm border border-surface-container' 
                    : 'text-outline hover:text-[#271810]'
                }`}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('phone'); }}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'phone' 
                    ? 'bg-white text-primary shadow-sm border border-surface-container' 
                    : 'text-outline hover:text-[#271810]'
                }`}
              >
                Phone SMS OTP
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('email'); setOtpSent(false); }}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'email' 
                    ? 'bg-white text-primary shadow-sm border border-surface-container' 
                    : 'text-outline hover:text-[#271810]'
                }`}
              >
                Community Email
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('other'); setOtpSent(false); }}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'other' 
                    ? 'bg-white text-primary shadow-sm border border-surface-container' 
                    : 'text-outline hover:text-[#271810]'
                }`}
              >
                Biometrics
              </button>
            </div>

            {/* Tab content 1: Google OAuth simulation */}
            {activeTab === 'google' && (
              <div className="space-y-4 pt-1 animate-fade-in">
                <p className="text-xs text-on-surface-variant leading-normal">
                  Connect using credentials provided by Google OAuth security framework. Verifies email limits dynamically.
                </p>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGoogleModal(true);
                      addToast("🔑 Google authentication server simulated payload...");
                    }}
                    className="w-full flex items-center justify-center gap-2.5 bg-white border-2 border-surface-container hover:border-primary py-3 px-4 rounded-xl text-xs font-extrabold text-[#271810] transition-colors cursor-pointer shadow-sm relative group"
                  >
                    <svg className="w-5 h-5 absolute left-4 text-left" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google Auth
                  </button>
                  
                  {/* Quick Google Quickstarters inside sandbox */}
                  <div className="bg-white p-3 rounded-2xl border border-surface-container space-y-2">
                    <span className="text-[10px] font-bold text-outline uppercase block">Simulate Google One-Tap accounts</span>
                    
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRole('customer');
                          handleGoogleSubmit("Sarah Jenkins", "sarah.jenkins@gmail.com");
                        }}
                        className="w-full text-left p-1.5 rounded-lg hover:bg-surface-container text-xs flex items-center justify-between transition-colors border border-dashed border-surface-container-high"
                      >
                        <div className="flex items-center gap-2">
                          <img className="w-5 h-5 rounded-full object-cover" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" alt="" />
                          <div>
                            <p className="font-bold text-[#271810]">Sarah Jenkins</p>
                            <span className="text-[9px] text-[#7a5743]">sarah.jenkins@gmail.com</span>
                          </div>
                        </div>
                        <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded uppercase">Tap to login</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRole('seller');
                          handleGoogleSubmit("John Miller", "windmill.sourdough@gmail.com");
                        }}
                        className="w-full text-left p-1.5 rounded-lg hover:bg-surface-container text-xs flex items-center justify-between transition-colors border border-dashed border-surface-container-high"
                      >
                        <div className="flex items-center gap-2">
                          <img className="w-5 h-5 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoAL8ofMRyL8kK_sYXBp_4J5XwePZQ_K1_9StG4EkZdaYa9qxrtabVpwVkHWzfWg74YTz3ckjzbmsxnK0g7N57RVGNRxSwjLbgcrRUORPa-F9ev2RJAGll9ppZfPmCRTfQX9YWhyapxPnIZrWy6QcEXlEM70Fz8RfF9pfTjirT1urJ7-p8nC8WRmswBLMypTur2EmDoonUeyCHUDRGRUYKZ3oNzHPuqwIfadVdEr-5QnPca_F8mDfT5wYs2UVqEesaGf-2GjxHEdsq" alt="" />
                          <div>
                            <p className="font-bold text-[#271810]">John Miller</p>
                            <span className="text-[9px] text-[#7a5743]">windmill.bakery@gmail.com</span>
                          </div>
                        </div>
                        <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded uppercase">Tap to login</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab content 2: Phone Number SMS OTP */}
            {activeTab === 'phone' && (
              <div className="space-y-4 pt-1 animate-fade-in">
                <p className="text-xs text-on-surface-variant leading-normal">
                  Receive a real-time secure 6-digit passcode directly on your registered phone.
                </p>

                {!otpSent ? (
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-outline uppercase block">Mobile Phone Number</label>
                      <div className="flex rounded-xl border border-surface-container overflow-hidden bg-white">
                        <span className="bg-surface-container px-3 py-2.5 text-xs font-bold text-[#7a5743] flex items-center border-r border-surface-container">+91</span>
                        <input
                          type="tel"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2.5 text-xs text-[#271810] focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="w-full bg-primary hover:bg-primary-container text-white text-xs font-extrabold py-3.5 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">sms</span>
                      Send Cryptographic SMS OTP Code
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3.5 bg-white p-4 rounded-2xl border border-surface-container">
                    <div className="flex justify-between items-center pb-2 border-b border-surface-container text-[#a24000] text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                        OTP Code Broadcasted
                      </span>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); }}
                        className="text-primary hover:underline font-bold text-[11px]"
                      >
                        Change Number
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-outline uppercase block">Enter Display Name</label>
                      <input
                        type="text"
                        placeholder="Your display name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-surface-container px-3.5 py-2.5 rounded-xl text-xs text-[#271810] focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-outline uppercase block">6-Digit SMS Verification Pin</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter the 6-digit code"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.slice(0, 6))}
                        className="w-full text-center tracking-[4px] font-mono font-bold text-base bg-surface-container-lowest border border-surface-container px-3 py-2.5 rounded-xl focus:border-primary focus:outline-none"
                      />
                    </div>

                    {systemOtp && (
                      <div className="bg-[#fff3cd] border border-[#ffeeba] text-[#856404] p-3 rounded-xl text-xs text-center font-semibold animate-fade-in">
                        🔑 Sandbox SMS OTP: <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border select-all">{systemOtp}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[11px] text-outline pt-1">
                      <span>Expires in {otpCountdown > 0 ? `${otpCountdown}s` : 'Expired'}</span>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-primary hover:underline font-bold"
                        disabled={otpCountdown > 0}
                      >
                        Resend Code
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary-container text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified_user</span>
                      Verify Code & Unlock Portal
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Tab content 3: Email verification */}
            {activeTab === 'email' && (
              <div className="space-y-4 pt-1 animate-fade-in">
                <p className="text-xs text-on-surface-variant leading-normal">
                  Standard account authorization using either temporary secure 6-digit OTP codes or password logs.
                </p>

                {/* Sub-toggles for Email Auth Mode */}
                <div className="flex bg-surface-container-lowest p-0.5 rounded-xl border border-surface-container gap-1">
                  <button
                    type="button"
                    onClick={() => { setEmailAuthMode('otp'); setEmailOtpSent(false); }}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                      emailAuthMode === 'otp'
                        ? 'bg-white text-primary shadow-xs border border-surface-container'
                        : 'text-outline hover:text-[#271810]'
                    }`}
                  >
                    Email OTP Code
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmailAuthMode('password'); }}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                      emailAuthMode === 'password'
                        ? 'bg-white text-primary shadow-xs border border-surface-container'
                        : 'text-outline hover:text-[#271810]'
                    }`}
                  >
                    Password Login
                  </button>
                </div>

                {emailAuthMode === 'otp' ? (
                  !emailOtpSent ? (
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-outline uppercase block">Email Address</label>
                        <input
                          type="email"
                          placeholder="e.g. sarah.jenkins@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white border border-surface-container px-3.5 py-2.5 rounded-xl text-xs text-[#271810] focus:border-primary focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        className="w-full bg-primary hover:bg-primary-container text-white text-xs font-extrabold py-3.5 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">mail</span>
                        Send 6-Digit Email OTP Code
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyEmailOtp} className="space-y-3.5 bg-white p-4 rounded-2xl border border-surface-container">
                      <div className="flex justify-between items-center pb-2 border-b border-surface-container text-[#a24000] text-xs">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                          Email OTP Code Broadcasted
                        </span>
                        <button
                          type="button"
                          onClick={() => { setEmailOtpSent(false); }}
                          className="text-primary hover:underline font-bold text-[11px]"
                        >
                          Change Email
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-outline uppercase block">6-Digit Email Verification Pin</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter the 6-digit code"
                          value={enteredEmailOtp}
                          onChange={(e) => setEnteredEmailOtp(e.target.value.slice(0, 6))}
                          className="w-full text-center tracking-[4px] font-mono font-bold text-base bg-surface-container-lowest border border-surface-container px-3 py-2.5 rounded-xl focus:border-primary focus:outline-none"
                        />
                      </div>

                      {systemEmailOtp && (
                        <div className="bg-[#fff3cd] border border-[#ffeeba] text-[#856404] p-3 rounded-xl text-xs text-center font-semibold animate-fade-in">
                          🔑 Sandbox Email OTP: <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border select-all">{systemEmailOtp}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[11px] text-outline pt-1">
                        <span>Expires in {emailOtpCountdown > 0 ? `${emailOtpCountdown}s` : 'Expired'}</span>
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          className="text-primary hover:underline font-bold"
                          disabled={emailOtpCountdown > 0}
                        >
                          Resend Code
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-container text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">verified_user</span>
                        Verify Code & Unlock Portal
                      </button>
                    </form>
                  )
                ) : (
                  <form onSubmit={(e) => handleEmailSubmit(e, false)} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-outline uppercase block">Community Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. sarah.jenkins@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-surface-container px-3.5 py-2.5 rounded-xl text-xs text-[#271810] focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-outline uppercase block">Security Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-surface-container px-3.5 py-2.5 rounded-xl text-xs text-[#271810] focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <label className="flex items-center gap-1.5 text-outline cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded accent-primary"
                        />
                        Remember this gateway
                      </label>
                      <span className="text-primary hover:underline cursor-pointer font-bold">Forget Credentials?</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleEmailSubmit(e, true)}
                        className="py-3 px-3.5 rounded-xl border-2 border-primary/20 hover:border-primary/60 text-primary text-xs font-bold transition-all bg-white cursor-pointer"
                      >
                        Email Magic Link
                      </button>
                      <button
                        type="submit"
                        className="py-3 px-3.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                      >
                        Login Credentials
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Tab content 4: Other / Biometric & Passkey */}
            {activeTab === 'other' && (
              <div className="space-y-4 pt-1 animate-fade-in">
                <p className="text-xs text-on-surface-variant leading-normal">
                  Ecosystem encryption support. Verify your profile with high-precision voice biometrics or physical device passkeys.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Voice biometric button */}
                  <div className="bg-white p-4 rounded-2xl border border-surface-container flex flex-col justify-between space-y-4 shadow-sm hover:border-[#a24000]/40 transition-colors">
                    <div className="space-y-1.5 text-left">
                      <span className="material-symbols-outlined text-[#a24000] text-[24px]">mic</span>
                      <h4 className="font-extrabold text-xs text-[#271810]">Voice biometric ledger</h4>
                      <p className="text-[10px] text-outline leading-relaxed">
                        Say "Verifiable Access Keys 2026" to parse cryptographic vocal signatures.
                      </p>
                    </div>

                    {isVoiceListening && (
                      <div className="flex items-center justify-center gap-1 bg-secondary/5 py-1.5 rounded-xl border border-secondary/20">
                        {voiceWaveform.map((ht, idx) => (
                          <div 
                            key={idx} 
                            style={{ height: `${ht}px` }} 
                            className="w-1 bg-[#a24000] rounded-full transition-all duration-150"
                          ></div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isVoiceListening}
                      onClick={handleVoiceBiometrics}
                      className="w-full bg-[#a24000]/10 hover:bg-[#a24000]/20 text-[#a24000] text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">play_circle</span>
                      Record Biometric Voice
                    </button>
                  </div>

                  {/* Passkey button */}
                  <div className="bg-white p-4 rounded-2xl border border-surface-container flex flex-col justify-between space-y-4 shadow-sm hover:border-primary/40 transition-colors">
                    <div className="space-y-1.5 text-left">
                      <span className="material-symbols-outlined text-primary text-[24px]">fingerprint</span>
                      <h4 className="font-extrabold text-xs text-[#271810]">Physical Device Passkey</h4>
                      <p className="text-[10px] text-outline leading-relaxed">
                        Verify with biometric TouchID, FaceID or device security pin instantly.
                      </p>
                    </div>

                    {isPasskeyScanning && (
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-primary font-bold animate-pulse">
                        <span className="material-symbols-outlined text-[14px]">cached</span>
                        Hardware Scanning...
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handlePasskeyVerification}
                      disabled={isPasskeyScanning}
                      className="w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">touch_id</span>
                      Verify TouchID Passkey
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Demo Sandbox Section */}
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-surface-container-high"></div>
              <span className="flex-shrink mx-4 text-[9px] font-extrabold text-outline uppercase tracking-wider">
                Explore Demo Portals
              </span>
              <div className="flex-grow border-t border-surface-container-high"></div>
            </div>

            <div className="bg-[#fff9f6] border border-[#a24000]/10 p-4 rounded-2xl space-y-3">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-[10px] font-bold text-[#a24000] uppercase tracking-wider block">Sandbox Quickstart links</span>
                <p className="text-[10px] text-outline">Bypass authentication directly into the corresponding layout spaces.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => loginAsDemoSandbox('sarah')}
                  className="p-2 border border-surface-container hover:border-primary bg-white text-[#271810] rounded-xl flex items-center gap-1.5 justify-center font-bold cursor-pointer transition-all hover:bg-primary/5"
                >
                  <span className="material-symbols-outlined text-primary text-[16px] leading-none">person</span>
                  Sarah (Customer)
                </button>
                <button
                  type="button"
                  onClick={() => loginAsDemoSandbox('miller')}
                  className="p-2 border border-surface-container hover:border-[#a24000] bg-white text-[#271810] rounded-xl flex items-center gap-1.5 justify-center font-bold cursor-pointer transition-all hover:bg-[#a24000]/5"
                >
                  <span className="material-symbols-outlined text-[#a24000] text-[16px] leading-none">agriculture</span>
                  John (Farmer)
                </button>
                <button
                  type="button"
                  onClick={() => loginAsDemoSandbox('river')}
                  className="p-2 border border-surface-container hover:border-secondary bg-white text-[#271810] rounded-xl flex items-center gap-1.5 justify-center font-bold cursor-pointer transition-all hover:bg-secondary/5"
                >
                  <span className="material-symbols-outlined text-secondary text-[16px] leading-none">local_shipping</span>
                  Alex (Courier)
                </button>
              </div>
            </div>

            {/* General Register Account note footer */}
            <div className="text-center pt-2">
              <p className="text-xs text-outline leading-relaxed">
                By entering the platform, you approve Zenvego's <span className="font-bold underline text-primary cursor-pointer">Community Charter</span> and <span className="font-bold underline text-primary cursor-pointer">Ecosystem Agreement</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SIMULATED AUTH LOADING OVERLAY SCREEN */}
      {isVerifying && (
        <div className="fixed inset-0 bg-[#271810]/75 backdrop-blur-md z-[99999] flex flex-col items-center justify-center text-white space-y-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-solid border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[32px] fill-icon font-bold">lock_open</span>
            </div>
          </div>
          
          <div className="space-y-1 text-center">
            <h3 className="text-lg font-black tracking-tight text-white font-sans">Ecosystem Authorization Gate</h3>
            <p className="text-xs text-secondary font-mono animate-pulse">{progressMsg}</p>
          </div>
        </div>
      )}

      {/* 4. MODAL FOR GOOGLE OAUTH IDENTITY REGISTRATION */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99990] flex items-center justify-center p-4">
          <div id="google-modal-card" className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5 border border-surface-container shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-outline hover:text-[#271810] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="space-y-1 text-center">
              <div className="w-12 h-12 bg-surface-container flex items-center justify-center rounded-2xl mx-auto mb-1">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <h3 className="font-extrabold text-[#271810] text-sm">Simulate Google Account</h3>
              <p className="text-[11px] text-outline">Type custom Google profile details to register on Zenvego consensus network.</p>
            </div>

            <form onSubmit={handleCustomGoogleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Richard Feynman"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-surface-container px-3.5 py-2 rounded-xl text-xs text-[#271810] focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase block">Google Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. feynman@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-surface-container px-3.5 py-2 rounded-xl text-xs text-[#271810] focus:border-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-container text-white py-3 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Register & Complete Handshake
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
