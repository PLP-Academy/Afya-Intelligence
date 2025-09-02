import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Heart,
  Phone,
  Calendar,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Shield,
  Stethoscope,
  User,
  Crown,
  ArrowLeft,
  Home,
  Menu,
  X
} from 'lucide-react';

type FamilyMember = {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  date_of_birth: string | null;
  gender: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type EmergencyContact = {
  id: string;
  family_member_id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
};

type HealthNote = {
  id: string;
  family_member_id: string;
  note_type: string;
  title: string;
  description: string | null;
  severity: number | null;
  created_at: string;
  updated_at: string;
};

type Appointment = {
  id: string;
  family_member_id: string;
  title: string;
  appointment_type: string;
  provider_name: string;
  date: string;
  time: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type SubscriptionTier = 'community_advocate' | 'health_champion' | 'global_advocate';

const Family = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showEditMemberDialog, setShowEditMemberDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    relationship: '',
    date_of_birth: '',
    gender: ''
  });

  const [healthNote, setHealthNote] = useState({
    family_member_id: '',
    note_type: 'symptom',
    title: '',
    description: '',
    severity: 1
  });

  const [appointment, setAppointment] = useState({
    family_member_id: '',
    title: '',
    appointment_type: 'doctor_visit',
    provider_name: '',
    date: '',
    time: '',
    notes: '',
    status: 'scheduled' as const
  });

  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showHealthNoteDialog, setShowHealthNoteDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);

  // Subscribe to user's subscription tier from context/query
  const [userTier, setUserTier] = useState<SubscriptionTier>('community_advocate');

  // Family Members query - temporarily mock for demo
  const { data: familyMembers = [], isLoading: isLoadingMembers, error: membersError } = useQuery({
    queryKey: ['familyMembers', authUser?.id],
    queryFn: async (): Promise<FamilyMember[]> => {
      // TEMPORARY: Mock data until database migration is applied
      return [
        {
          id: '1',
          user_id: authUser?.id || '',
          name: 'Demo Family Member',
          relationship: 'child',
          date_of_birth: '2010-01-01',
          gender: 'male',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    },
    enabled: true, // Always enable for demo
  });

  // Emergency Contacts query with member stats - temporarily mock for demo
  const { data: emergencyContacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['emergencyContacts', authUser?.id],
    queryFn: async (): Promise<(EmergencyContact & { member_name?: string })[]> => {
      // TEMPORARY: Mock data until database migration is applied
      return [];
    },
    enabled: true, // Always enable for demo
  });

  // Add Family Member Mutation - TEMPORARY: Mock implementation for demo
  const addFamilyMemberMutation = useMutation({
    mutationFn: async (memberData: Omit<FamilyMember, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!authUser?.id) throw new Error('User not authenticated');

      // Check member limit based on tier
      const maxMembers = userTier === 'community_advocate' ? 4 :
                         userTier === 'health_champion' ? 10 :
                         userTier === 'global_advocate' ? 15 : 4;

      const activeMembers = familyMembers.length;
      if (activeMembers >= maxMembers) {
        throw new Error(`You've reached the maximum of ${maxMembers} family members for your tier.`);
      }

      // TEMPORARY: Mock data addition instead of database call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      const newMember: FamilyMember = {
        id: `demo-${Date.now()}`,
        user_id: authUser.id,
        name: memberData.name,
        relationship: memberData.relationship,
        date_of_birth: memberData.date_of_birth,
        gender: memberData.gender,
        is_active: memberData.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('✅ Mock family member added:', newMember);
      return [newMember];
    },
    onSuccess: (newMember) => {
      // Update local query cache with new member
      queryClient.setQueryData<FamilyMember[]>(['familyMembers', authUser?.id], (oldData) => {
        return oldData ? [...oldData, ...newMember] : newMember;
      });
      setNewMember({ name: '', relationship: '', date_of_birth: '', gender: '' });
      setShowAddMemberDialog(false);
    },
    onError: (error: Error) => {
      console.error('❌ Failed to add family member:', error.message);
      alert(`Error: ${error.message}`);
    }
  });

  // Edit Family Member Mutation - TEMPORARY: Mock implementation for demo
  const editFamilyMemberMutation = useMutation({
    mutationFn: async (memberData: Omit<FamilyMember, 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!authUser?.id) throw new Error('User not authenticated');

      // TEMPORARY: Mock data update instead of database call
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

      console.log('✅ Mock family member updated:', memberData);

      // Return complete FamilyMember object for onSuccess callback
      return {
        ...memberData,
        user_id: authUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as FamilyMember;
    },
    onSuccess: (updatedMember) => {
      // Update local query cache with updated member
      queryClient.setQueryData<FamilyMember[]>(['familyMembers', authUser?.id], (oldData) => {
        if (!oldData) return [];
        return oldData.map(member => member.id === updatedMember.id ? updatedMember : member);
      });
      setEditingMember(null);
      setShowEditMemberDialog(false);
    },
    onError: (error: Error) => {
      console.error('❌ Failed to update family member:', error.message);
      alert(`Error: ${error.message}`);
    }
  });

  const handleAddMember = () => {
    if (!newMember.name || !newMember.relationship) {
      return;
    }

    const formattedDate = newMember.date_of_birth ?
      new Date(newMember.date_of_birth).toISOString().split('T')[0] : null;

    addFamilyMemberMutation.mutate({
      name: newMember.name,
      relationship: newMember.relationship,
      date_of_birth: formattedDate,
      gender: newMember.gender || null,
      is_active: true
    });
  };

  const getMaxMembers = () => {
    return userTier === 'community_advocate' ? 4 :
           userTier === 'health_champion' ? 10 :
           userTier === 'global_advocate' ? 15 : 4;
  };

  const getMemberCount = () => {
    return familyMembers.length;
  };

  const relationshipOptions = [
    { value: 'spouse', label: 'Spouse/Partner' },
    { value: 'child', label: 'Child' },
    { value: 'parent', label: 'Parent' },
    { value: 'grandparent', label: 'Grandparent' },
    { value: 'grandchild', label: 'Grandchild' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'uncle_aunt', label: 'Uncle/Aunt' },
    { value: 'niece_nephew', label: 'Niece/Nephew' },
    { value: 'cousin', label: 'Cousin' },
    { value: 'other', label: 'Other Family' }
  ];

  // Add Health Note Mutation - TEMPORARY: Mock implementation for demo
  const addHealthNoteMutation = useMutation({
    mutationFn: async (noteData: Omit<HealthNote, 'id' | 'created_at' | 'updated_at'>) => {
      if (!authUser?.id) throw new Error('User not authenticated');

      // TEMPORARY: Mock data addition instead of database call
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

      const newNote: HealthNote = {
        id: `note-${Date.now()}`,
        family_member_id: noteData.family_member_id,
        note_type: noteData.note_type,
        title: noteData.title,
        description: noteData.description,
        severity: noteData.severity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('✅ Mock health note added:', newNote);
      return newNote;
    },
    onSuccess: (newNote) => {
      console.log('Health note successfully added:', newNote);
      setHealthNote({ family_member_id: '', note_type: 'symptom', title: '', description: '', severity: 1 });
      setSelectedMember(null);
      setShowHealthNoteDialog(false);
    },
    onError: (error: Error) => {
      console.error('❌ Failed to add health note:', error.message);
      alert(`Error adding health note: ${error.message}`);
    }
  });

  // Add Appointment Mutation - TEMPORARY: Mock implementation for demo
  const addAppointmentMutation = useMutation({
    mutationFn: async (apptData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
      if (!authUser?.id) throw new Error('User not authenticated');

      // TEMPORARY: Mock data addition instead of database call
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

      const newAppt: Appointment = {
        id: `appt-${Date.now()}`,
        family_member_id: apptData.family_member_id,
        title: apptData.title,
        appointment_type: apptData.appointment_type,
        provider_name: apptData.provider_name,
        date: apptData.date,
        time: apptData.time,
        notes: apptData.notes,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('✅ Mock appointment added:', newAppt);
      return newAppt;
    },
    onSuccess: (newAppt) => {
      console.log('Appointment successfully scheduled:', newAppt);
      setAppointment({
        family_member_id: '',
        title: '',
        appointment_type: 'doctor_visit',
        provider_name: '',
        date: '',
        time: '',
        notes: '',
        status: 'scheduled'
      });
      setSelectedMember(null);
      setShowAppointmentDialog(false);
    },
    onError: (error: Error) => {
      console.error('❌ Failed to schedule appointment:', error.message);
      alert(`Error scheduling appointment: ${error.message}`);
    }
  });

  // Updated handlers for health notes and appointments
  const handleOpenHealthNoteDialog = (member: FamilyMember) => {
    setSelectedMember(member);
    setHealthNote(prev => ({ ...prev, family_member_id: member.id }));
    setShowHealthNoteDialog(true);
  };

  const handleOpenAppointmentDialog = (member: FamilyMember) => {
    setSelectedMember(member);
    setAppointment(prev => ({ ...prev, family_member_id: member.id }));
    setShowAppointmentDialog(true);
  };

  const handleAddHealthNote = () => {
    if (!healthNote.title || !healthNote.family_member_id) {
      return;
    }

    addHealthNoteMutation.mutate({
      ...healthNote,
      description: healthNote.description || null
    });
  };

  const handleAddAppointment = () => {
    if (!appointment.title || !appointment.date || !appointment.time || !appointment.provider_name || !appointment.family_member_id) {
      return;
    }

    addAppointmentMutation.mutate(appointment);
  };

  if (isLoadingMembers) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading family health dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header - Matching Dashboard Design */}
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand Section */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg health-gradient flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold">Afya Intelligence</h1>
                <p className="text-xs text-muted-foreground">Family Health</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Badge className={`${userTier === 'global_advocate' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                <Crown className="h-3 w-3 mr-1" />
                {userTier === 'community_advocate' ? 'Free' :
                 userTier === 'health_champion' ? 'Premium' : 'Premium Plus'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary hover:text-white"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
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
                <div className="flex items-center justify-between">
                  <Badge className={`${userTier === 'global_advocate' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    <Crown className="h-3 w-3 mr-1" />
                    {userTier === 'community_advocate' ? 'Free' :
                     userTier === 'health_champion' ? 'Premium' : 'Premium Plus'}
                  </Badge>
                </div>
                <div className="flex flex-col gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/');
                      setIsMenuOpen(false);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/dashboard');
                      setIsMenuOpen(false);
                    }}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Main Dashboard
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="border-b bg-background/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Family Health Dashboard</h1>
                <p className="text-muted-foreground">Track health for everyone in your family</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* AI Health Insights for Family */}
        <div className="mb-6">
          <Alert className={`${
            getMemberCount() >= Math.floor(getMaxMembers() * 0.8) ? 'border-yellow-500' :
            getMemberCount() === 0 ? 'border-blue-500' : 'border-green-500'
          }`}>
            {getMemberCount() >= Math.floor(getMaxMembers() * 0.8) ? <AlertTriangle className="h-4 w-4" /> :
             getMemberCount() === 0 ? <Heart className="h-4 w-4 text-blue-600" /> :
             <CheckCircle className="h-4 w-4" />}
            <AlertDescription>
              {getMemberCount() === 0 ? (
                <>
                  <strong>Welcome to Your Family Health Network! 👨‍👩‍👧‍👦</strong>
                  <br />
                  Start building strong health connections for everyone in your family.
                  Family health tracking helps coordinate care, share insights, and ensure everyone stays healthy together.
                </>
              ) : getMemberCount() >= Math.floor(getMaxMembers() * 0.8) ? (
                <>
                  <strong>Great Progress on Your Health Network! 🎯</strong>
                  <br />
                  You have {getMemberCount()}/{getMaxMembers()} family members added.
                  Consider precautions: Diverse health tracking helps identify patterns early.
                  {userTier === 'community_advocate' && (
                    <div className="mt-2">
                      <strong>💡 Upgrade Tip:</strong> Premium plans support larger families with advanced health tracking features.
                    </div>
                  )}
                </>
              ) : getMemberCount() <= 2 ? (
                <>
                  <strong>Building Your Care Network! 💪</strong>
                  <br />
                  You have {getMemberCount()} family {getMemberCount() === 1 ? 'member' : 'members'} added.
                  Add more family members to get comprehensive health insights and coordinated care planning.
                  Family health tracking helps everyone stay healthier together!
                </>
              ) : (
                <>
                  <strong>Excellent Family Health Network! ⭐</strong>
                  <br />
                  You have {getMemberCount()}/{getMaxMembers()} family members in your care network.
                  This comprehensive approach to family health enables early detection, coordinated care, and shared wellness journeys.
                  Health insights will become more powerful as you continue using the system!
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>

        {/* Usage Summary */}
        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Family Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  {getMemberCount()} of {getMaxMembers()} members added
                </span>
                <span className="text-xs text-muted-foreground">
                  {getMaxMembers() - getMemberCount()} spots remaining
                </span>
              </div>
              <Progress value={(getMemberCount() / getMaxMembers()) * 100} className="h-2" />

              {/* Upgrade Card for Low Limits */}
              {getMemberCount() >= getMaxMembers() - 1 && userTier === 'community_advocate' && (
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
                    <Crown className="h-4 w-4" />
                    Upgrade for More Family Members
                  </div>
                  <p className="text-xs text-blue-700 mb-3">
                    Premium plans allow 5-10 family members and advanced health tracking features.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate('/pricing')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    View Premium Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Family Members Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Family Members ({getMemberCount()})</h2>
            <Button
              onClick={() => setShowAddMemberDialog(true)}
              disabled={getMemberCount() >= getMaxMembers()}
              className="health-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Family Member
            </Button>
          </div>

          {/* Empty State */}
          {familyMembers.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Start Building Your Family Health Network</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Add family members to track their health, manage appointments, and receive coordinated care.
                </p>
                <Button onClick={() => setShowAddMemberDialog(true)} className="health-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Family Member
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {familyMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{member.name}</CardTitle>
                          <CardDescription className="text-capitalize">
                            {member.relationship.replace('_', ' ')}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            console.log('✏️ Edit button clicked for member:', member.name);
                            setEditingMember(member);
                            setShowEditMemberDialog(true);
                          }}
                          title={`Edit ${member.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Age Calculation */}
                    {member.date_of_birth && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Age: {new Date().getFullYear() - new Date(member.date_of_birth).getFullYear()} years
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>Health notes: {Math.floor(Math.random() * 5)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span>Appointments: {Math.floor(Math.random() * 3)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-green-500" />
                        <span>Emergency contacts: {
                          emergencyContacts.filter(ec => ec.family_member_id === member.id).length
                        }</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOpenHealthNoteDialog(member)}
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        Health Notes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOpenAppointmentDialog(member)}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Appointments
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats Section */}
        {familyMembers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Family Health Summary</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Health Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {familyMembers.reduce((sum) => sum + Math.floor(Math.random() * 5), 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {familyMembers.reduce((sum) => sum + Math.floor(Math.random() * 3), 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Emergency Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {emergencyContacts.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Wellness Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">8.5</div>
                  <p className="text-xs text-muted-foreground">Above average</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Add Family Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Family Member</DialogTitle>
            <DialogDescription>
              Add a new family member to track their health and wellbeing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="member-name">Full Name *</Label>
              <Input
                id="member-name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div>
              <Label htmlFor="relationship">Relationship *</Label>
              <Select onValueChange={(value) => setNewMember({ ...newMember, relationship: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={(value) => setNewMember({ ...newMember, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={newMember.date_of_birth}
                  onChange={(e) => setNewMember({ ...newMember, date_of_birth: e.target.value })}
                />
              </div>
            </div>

            {/* Tier Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-1">
                <Shield className="h-4 w-4" />
                Family Limit: {getMemberCount()}/{getMaxMembers()}
              </div>
              <div className="text-xs text-blue-700">
                {userTier === 'community_advocate' ? 'Free tier allows up to 4 family members' :
                 userTier === 'health_champion' ? 'Premium tier allows up to 10 family members' :
                 'Premium Plus tier allows up to 15 family members'}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddMemberDialog(false)}
              disabled={addFamilyMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!newMember.name || !newMember.relationship || addFamilyMemberMutation.isPending}
              className="health-button"
            >
              {addFamilyMemberMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Family Member Dialog */}
      <Dialog open={showEditMemberDialog} onOpenChange={setShowEditMemberDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Family Member</DialogTitle>
            <DialogDescription>
              Update family member information and health tracking details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-member-name">Full Name *</Label>
              <Input
                id="edit-member-name"
                value={editingMember?.name || ''}
                onChange={(e) => editingMember && setEditingMember({ ...editingMember, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div>
              <Label htmlFor="edit-relationship">Relationship *</Label>
              <Select
                value={editingMember?.relationship || ''}
                onValueChange={(value) => editingMember && setEditingMember({ ...editingMember, relationship: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-gender">Gender</Label>
                <Select
                  value={editingMember?.gender || ''}
                  onValueChange={(value) => editingMember && setEditingMember({ ...editingMember, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-dob">Date of Birth</Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={editingMember?.date_of_birth || ''}
                  onChange={(e) => editingMember && setEditingMember({ ...editingMember, date_of_birth: e.target.value })}
                />
              </div>
            </div>

            {/* Current Member Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800 mb-1">
                <CheckCircle className="h-4 w-4" />
                Member ID: {editingMember?.id}
              </div>
              <div className="text-xs text-green-700">
                Created: {editingMember?.created_at ? new Date(editingMember.created_at).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditMemberDialog(false)}
              disabled={editFamilyMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingMember) {
                  const formattedDate = editingMember.date_of_birth ?
                    new Date(editingMember.date_of_birth).toISOString().split('T')[0] : null;

                  editFamilyMemberMutation.mutate({
                    id: editingMember.id,
                    name: editingMember.name,
                    relationship: editingMember.relationship,
                    date_of_birth: formattedDate,
                    gender: editingMember.gender,
                    is_active: editingMember.is_active
                  });
                }
              }}
              disabled={!editingMember?.name || !editingMember?.relationship || editFamilyMemberMutation.isPending}
              className="health-button"
            >
              {editFamilyMemberMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Health Note Dialog */}
      <Dialog open={showHealthNoteDialog} onOpenChange={setShowHealthNoteDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Health Note</DialogTitle>
            <DialogDescription>
              Record a health observation, symptom, medication, or procedure for {selectedMember?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="note-type">Note Type *</Label>
              <Select
                value={healthNote.note_type}
                onValueChange={(value) => setHealthNote(prev => ({ ...prev, note_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select note type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="symptom">Symptom</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="procedure">Procedure/Surgery</SelectItem>
                  <SelectItem value="appointment">Appointment Summary</SelectItem>
                  <SelectItem value="observation">General Observation</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="note-title">Title/Summary *</Label>
              <Input
                id="note-title"
                value={healthNote.title}
                onChange={(e) => setHealthNote(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief title or summary"
              />
            </div>

            <div>
              <Label htmlFor="note-description">Details</Label>
              <Textarea
                id="note-description"
                value={healthNote.description}
                onChange={(e) => setHealthNote(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details, observations, or context..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="note-severity">Severity/Importance</Label>
              <Select
                value={healthNote.severity.toString()}
                onValueChange={(value) => setHealthNote(prev => ({ ...prev, severity: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low - Minor or routine</SelectItem>
                  <SelectItem value="2">Moderate - Needs attention</SelectItem>
                  <SelectItem value="3">High - Important concern</SelectItem>
                  <SelectItem value="4">Critical - Urgent attention needed</SelectItem>
                  <SelectItem value="5">Emergency - Immediate action required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selected Member Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-1">
                <User className="h-4 w-4" />
                Recording for: {selectedMember?.name}
              </div>
              <div className="text-xs text-blue-700">
                Relationship: {selectedMember?.relationship.replace('_', ' ')} |
                Type: {healthNote.note_type.replace('_', ' ')}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowHealthNoteDialog(false)}
              disabled={addHealthNoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddHealthNote}
              disabled={!healthNote.title || addHealthNoteMutation.isPending}
              className="health-button"
            >
              {addHealthNoteMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Note...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Record Note
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Appointment Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              Schedule a medical appointment or test for {selectedMember?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="appt-title">Appointment Title *</Label>
              <Input
                id="appt-title"
                value={appointment.title}
                onChange={(e) => setAppointment(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Routine Checkup, Blood Test, Specialist Consultation"
              />
            </div>

            <div>
              <Label htmlFor="appt-type">Appointment Type *</Label>
              <Select
                value={appointment.appointment_type}
                onValueChange={(value) => setAppointment(prev => ({ ...prev, appointment_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor_visit">General Doctor Visit</SelectItem>
                  <SelectItem value="specialist">Specialist Consultation</SelectItem>
                  <SelectItem value="dental">Dental Appointment</SelectItem>
                  <SelectItem value="laboratory">Laboratory Test</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="therapy">Physical Therapy</SelectItem>
                  <SelectItem value="screening">Health Screening</SelectItem>
                  <SelectItem value="follow_up">Follow-up Visit</SelectItem>
                  <SelectItem value="emergency">Emergency Care</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="provider-name">Healthcare Provider *</Label>
              <Input
                id="provider-name"
                value={appointment.provider_name}
                onChange={(e) => setAppointment(prev => ({ ...prev, provider_name: e.target.value }))}
                placeholder="Doctor's name, clinic, or healthcare facility"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appt-date">Date *</Label>
                <Input
                  id="appt-date"
                  type="date"
                  value={appointment.date}
                  onChange={(e) => setAppointment(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="appt-time">Time *</Label>
                <Input
                  id="appt-time"
                  type="time"
                  value={appointment.time}
                  onChange={(e) => setAppointment(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="appt-notes">Appointment Notes</Label>
              <Textarea
                id="appt-notes"
                value={appointment.notes}
                onChange={(e) => setAppointment(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Preparation instructions, what to bring, concerns to discuss..."
                rows={2}
              />
            </div>

            {/* Selected Member Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800 mb-1">
                <Calendar className="h-4 w-4" />
                Scheduling for: {selectedMember?.name}
              </div>
              <div className="text-xs text-green-700">
                {appointment.date && appointment.time && (
                  <>Date & Time: {new Date(appointment.date).toLocaleDateString()} at {appointment.time}</>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAppointmentDialog(false)}
              disabled={addAppointmentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAppointment}
              disabled={!appointment.title || !appointment.date || !appointment.time || !appointment.provider_name || addAppointmentMutation.isPending}
              className="health-button"
            >
              {addAppointmentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Family;
