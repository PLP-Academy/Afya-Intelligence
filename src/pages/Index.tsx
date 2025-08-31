import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Shield, Users, Globe, BookOpen, TrendingUp, Check, Star, ArrowRight, Menu, X, Sun, Moon, Download } from 'lucide-react';

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [selectedTier, setSelectedTier] = useState('community_advocate');
  const [expandedSDG, setExpandedSDG] = useState(null);

  // PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Dark mode toggle
    const isDark = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const sdgTargets = [
    {
      number: "3.1",
      title: "Reduce Maternal Mortality",
      description: "Reduce the global maternal mortality ratio to less than 70 per 100,000 live births",
      currentProgress: 65,
      targetValue: "70 per 100,000",
      currentValue: "211 per 100,000",
      howAppHelps: "Early detection of pregnancy complications through symptom tracking"
    },
    {
      number: "3.2", 
      title: "End Preventable Deaths",
      description: "End preventable deaths of newborns and children under 5 years",
      currentProgress: 72,
      targetValue: "25 per 1,000",
      currentValue: "38 per 1,000",
      howAppHelps: "Family tracking features help monitor child health symptoms"
    },
    {
      number: "3.3",
      title: "Combat Communicable Diseases", 
      description: "End epidemics of AIDS, tuberculosis, malaria and neglected tropical diseases",
      currentProgress: 58,
      targetValue: "90% reduction",
      currentValue: "58% progress",
      howAppHelps: "AI pattern detection identifies potential outbreaks through symptom clustering"
    },
    {
      number: "3.4",
      title: "Reduce Non-Communicable Diseases",
      description: "Reduce by one third premature mortality from non-communicable diseases",
      currentProgress: 45,
      targetValue: "33% reduction",
      currentValue: "15% progress", 
      howAppHelps: "Long-term symptom tracking enables early intervention for chronic conditions"
    },
    {
      number: "3.8",
      title: "Universal Health Coverage",
      description: "Achieve universal health coverage for all",
      currentProgress: 38,
      targetValue: "100% coverage",
      currentValue: "38% coverage",
      howAppHelps: "Democratizes health tracking regardless of economic status or location"
    }
  ];

  const tiers = [
    {
      id: 'community_advocate',
      name: 'Community Advocate',
      price: 'Free',
      description: 'Perfect for getting started with health tracking',
      features: [
        '30-day symptom history',
        'SDG 3 education modules',
        'Basic AI health insights',
        'Impact visibility dashboard',
        'Offline tracking capability',
        'Community support forum'
      ],
      impact: 'Support SDG 3 awareness in your community',
      popular: false
    },
    {
      id: 'health_champion',
      name: 'Health Champion', 
      price: '$1/month',
      description: 'Enhanced tracking for serious health advocates',
      features: [
        'Unlimited symptom history',
        'Advanced AI pattern detection',
        'Personalized health education',
        'Weekly health reports',
        'Data export capabilities',
        'Premium support'
      ],
      impact: '60% of fees fund platform development',
      popular: true
    },
    {
      id: 'global_advocate',
      name: 'Global Advocate',
      price: '$3/month', 
      description: 'Maximum impact for global health leaders',
      features: [
        'Anonymous data contribution',
        'Early access to new features',
        'Monthly expert consultations',
        'Family tracking (up to 4 people)',
        'Priority customer support',
        'Research participation opportunities'
      ],
      impact: 'Directly funds health initiatives in underserved regions',
      popular: false
    }
  ];

  const impactStats = [
    { metric: 'Active Users', value: 12847, change: '+23%' },
    { metric: 'Symptoms Tracked', value: 89342, change: '+156%' },
    { metric: 'Early Detections', value: 1247, change: '+89%' },
    { metric: 'Communities Served', value: 34, change: '+12%' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Install PWA Prompt */}
      {showInstallPrompt && (
        <div className="install-prompt">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5" />
            <div>
              <p className="font-semibold">Install Symptom Journal</p>
              <p className="text-sm opacity-90">Get the full app experience</p>
            </div>
            <Button 
              onClick={handleInstallClick}
              size="sm"
              variant="secondary"
              className="ml-4"
            >
              Install
            </Button>
            <Button 
              onClick={() => setShowInstallPrompt(false)}
              size="sm"
              variant="ghost"
              className="p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg health-gradient flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Symptom Journal</h1>
                <p className="text-xs text-muted-foreground">SDG 3 Health Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#sdg-hub" className="text-sm font-medium hover:text-primary transition-colors">SDG Hub</a>
              <a href="#transparency" className="text-sm font-medium hover:text-primary transition-colors">Transparency</a>
              <a href="#tiers" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
              <Button 
                onClick={toggleDarkMode}
                variant="ghost" 
                size="sm"
                className="p-2"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button 
                onClick={() => setShowLoginModal(true)}
                variant="ghost"
                size="sm"
              >
                Login
              </Button>
              <Button 
                onClick={() => setShowRegisterModal(true)}
                size="sm"
                className="health-button"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              variant="ghost" 
              size="sm"
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t bg-background py-4">
              <div className="flex flex-col gap-4">
                <a href="#sdg-hub" className="text-sm font-medium hover:text-primary transition-colors">SDG Hub</a>
                <a href="#transparency" className="text-sm font-medium hover:text-primary transition-colors">Transparency</a>
                <a href="#tiers" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    onClick={toggleDarkMode}
                    variant="ghost" 
                    size="sm"
                  >
                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Theme
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setShowLoginModal(true)}
                      variant="ghost"
                      size="sm"
                    >
                      Login
                    </Button>
                    <Button 
                      onClick={() => setShowRegisterModal(true)}
                      size="sm"
                      className="health-button"
                    >
                      Get Started
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
              🌍 UN SDG 3: Good Health and Well-Being
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
              Your Health Journey,<br />Our Global Mission
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Empowering communities worldwide with accessible health tracking and education. 
              Join the movement to achieve UN SDG 3: Good Health and Well-Being for all, everywhere.
            </p>
            
            {/* Interactive World Impact Map */}
            <div className="relative w-full max-w-2xl mx-auto mb-12 p-8 health-card">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl"></div>
              <div className="relative">
                <h3 className="text-lg font-semibold mb-4">Global Health Impact</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {impactStats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-primary">{stat.value.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{stat.metric}</div>
                      <div className="text-xs text-green-500">{stat.change}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => setShowRegisterModal(true)}
                size="lg"
                className="health-button text-lg px-8 py-4"
              >
                Start Your Health Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-4"
                onClick={() => document.getElementById('sdg-hub').scrollIntoView({ behavior: 'smooth' })}
              >
                Learn About SDG 3
                <BookOpen className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SDG 3 Education Hub */}
      <section id="sdg-hub" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              📚 Education Hub
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Understanding SDG 3</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore the UN Sustainable Development Goal 3 targets and see how your health tracking 
              contributes to global health improvements.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sdgTargets.map((target, index) => (
              <Card 
                key={target.number} 
                className={`sdg-card ${expandedSDG === target.number ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setExpandedSDG(expandedSDG === target.number ? null : target.number)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary" className="text-xs">
                      Target {target.number}
                    </Badge>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{target.currentProgress}%</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{target.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {target.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Current: {target.currentValue}</span>
                        <span>Target: {target.targetValue}</span>
                      </div>
                      <Progress value={target.currentProgress} className="h-2" />
                    </div>
                    
                    {expandedSDG === target.number && (
                      <div className="pt-4 border-t fade-in">
                        <h4 className="font-semibold text-sm mb-2 text-primary">How Our App Helps</h4>
                        <p className="text-sm text-muted-foreground">{target.howAppHelps}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Project Transparency */}
      <section id="transparency" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              🔒 Transparency
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Open Source & Accountable</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We believe in complete transparency. See exactly how your data is used, 
              where funding goes, and how we're making a global impact.
            </p>
          </div>

          <div className="grid gap-8 md:grip-cols-2 lg:grid-cols-3">
            {/* Open Source */}
            <Card className="health-card text-center">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Open Source Code</CardTitle>
                <CardDescription>
                  Full transparency with publicly available source code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View on GitHub
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Data Privacy */}
            <Card className="health-card text-center">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Data Privacy</CardTitle>
                <CardDescription>
                  Your health data is encrypted and never shared without consent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    End-to-end encryption
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    GDPR compliant
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    User-controlled sharing
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impact Dashboard */}
            <Card className="health-card text-center md:col-span-2 lg:col-span-1">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Impact Tracking</CardTitle>
                <CardDescription>
                  Real-time visibility into global health improvements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Early Detections</span>
                    <span className="font-semibold text-primary">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Lives Impacted</span>
                    <span className="font-semibold text-primary">12,847</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Communities</span>
                    <span className="font-semibold text-primary">34</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tier Selection */}
      <section id="tiers" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              💚 Choose Your Impact
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every subscription directly funds global health initiatives. 
              Choose the tier that matches your commitment to SDG 3.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {tiers.map((tier, index) => (
              <Card 
                key={tier.id}
                className={`tier-card relative ${tier.popular ? 'active' : ''} ${selectedTier === tier.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedTier(tier.id)}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <div className="text-4xl font-bold text-primary mb-2">{tier.price}</div>
                  <CardDescription className="text-sm">{tier.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="text-xs text-muted-foreground mb-3">Your Impact:</div>
                    <div className="text-sm font-medium text-primary">{tier.impact}</div>
                  </div>
                  
                  <Button 
                    className={`w-full ${tier.popular ? 'health-button' : ''}`}
                    variant={tier.popular ? 'default' : 'outline'}
                    onClick={() => setShowRegisterModal(true)}
                  >
                    {tier.price === 'Free' ? 'Get Started Free' : `Subscribe ${tier.price}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Funding Transparency */}
          <div className="mt-16 max-w-2xl mx-auto">
            <Card className="health-card">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Where Your Money Goes</CardTitle>
                <CardDescription>
                  Transparent allocation of subscription funds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Platform Development</span>
                    <span className="font-semibold">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Health Initiative Funding</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Operations & Support</span>
                    <span className="font-semibold">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Welcome Back</CardTitle>
                <Button 
                  onClick={() => setShowLoginModal(false)}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Sign in to continue your health journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
              <Button className="w-full health-button">
                Sign In
              </Button>
              <div className="text-center">
                <Button 
                  variant="link" 
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }}
                  className="text-sm"
                >
                  Don't have an account? Sign up
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Join the Movement</CardTitle>
                <Button 
                  onClick={() => setShowRegisterModal(false)}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Start your journey toward better health and global impact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
              
              {/* Tier Selection in Modal */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Choose Your Tier</label>
                <div className="space-y-2">
                  {tiers.map((tier) => (
                    <div 
                      key={tier.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedTier === tier.id ? 'border-primary bg-primary/5' : 'border-input'
                      }`}
                      onClick={() => setSelectedTier(tier.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{tier.name}</div>
                          <div className="text-sm text-muted-foreground">{tier.price}</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedTier === tier.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}>
                          {selectedTier === tier.id && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="consent" className="rounded border-input" />
                  <label htmlFor="consent" className="text-sm">
                    I consent to anonymous data sharing for global health research
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="terms" className="rounded border-input" />
                  <label htmlFor="terms" className="text-sm">
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
              </div>

              <Button className="w-full health-button">
                Create Account & Start Journey
              </Button>
              
              <div className="text-center">
                <Button 
                  variant="link" 
                  onClick={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                  className="text-sm"
                >
                  Already have an account? Sign in
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;
