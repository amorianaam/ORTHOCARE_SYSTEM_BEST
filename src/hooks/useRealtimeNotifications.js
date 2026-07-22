import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FlaskConical, Activity, UserPlus, Syringe, DollarSign, Database, AlertTriangle } from 'lucide-react';
import { getSocket, joinRoom } from '../utils/socket';
import useSocketStore from '../store/useSocketStore';

/**
 * useRealtimeNotifications — connects to Socket.IO and listens to role-specific events.
 * Call this once at the top-level component (e.g., Layout or App).
 * @param {string} role - user role string
 */
const useRealtimeNotifications = (role) => {
  const { setPatientEvent, setLabEvent, setRadiologyEvent, setSilentUpdate } = useSocketStore();
  useEffect(() => {
    if (!role) return;

    const socket = getSocket();
    joinRoom(role);

    // ── Cashier: new patient registered by secretary ──
    socket.on('patient:registered', (data = {}) => {
      const patientName = data.patientName || data.patient_name || 'مريض';
      toast.info(
        <div className="flex items-center gap-3">
          <UserPlus size={20} className="text-white" />
          <span className="font-semibold text-sm">مريض جديد: {patientName}</span>
        </div>, {
          position: 'bottom-right',
          autoClose: 6000,
          icon: false,
        }
      );
    });

    // ── Doctor: patient moved to waiting ──
    socket.on('patient:waiting', (data = {}) => {
      const fullName = data.patientName || data.patient_name;
      const baseMessage = data.message || 'تم إضافة مريض جديد لقائمة الانتظار';
      const finalMessage = fullName ? `${baseMessage} - ${fullName}` : baseMessage;
      setPatientEvent({ message: finalMessage, ...data });
      toast.success(
        <div className="flex items-center gap-3">
          <UserPlus size={20} className="text-white" />
          <span className="font-semibold text-sm">{finalMessage}</span>
        </div>, {
          position: 'bottom-right',
          autoClose: 5000,
          icon: false,
        }
      );
    });

    // ── Lab/Radiology: new request ──
    socket.on('request:new', (data = {}) => {
      const baseMessage = data.message || 'طلب خدمة جديد';
      setLabEvent({ message: baseMessage, ...data });
      toast.info(
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-white" />
          <span className="font-semibold text-sm">{baseMessage}</span>
        </div>, {
          position: 'bottom-right',
          autoClose: 6000,
          icon: false,
        }
      );
    });

    // ── Doctor: lab completed ──
    socket.on('lab:completed', (data = {}) => {
      const fullName = data.patientName || data.patient_name;
      const baseMessage = data.message || 'تم إنجاز التحليل';
      const finalMessage = fullName ? `${baseMessage} - ${fullName}` : baseMessage;
      setLabEvent({ message: finalMessage, ...data });
      toast.success(
        <div className="flex items-center gap-3">
          <FlaskConical size={20} className="text-white" />
          <span className="font-semibold text-sm">{finalMessage}</span>
        </div>, {
          position: 'bottom-right',
          autoClose: 6000,
          icon: false,
        }
      );
    });

    // ── Doctor: radiology completed ──
    socket.on('radiology:completed', (data = {}) => {
      const fullName = data.patientName || data.patient_name;
      const baseMessage = data.message || 'تم إنجاز الأشعة';
      const finalMessage = fullName ? `${baseMessage} - ${fullName}` : baseMessage;
      setRadiologyEvent({ message: finalMessage, ...data });
      toast.success(
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-white" />
          <span className="font-semibold text-sm">{finalMessage}</span>
        </div>, {
          position: 'bottom-right',
          autoClose: 6000,
          icon: false,
        }
      );
    });

    // ── Surgery Coordinator: new referral ──
    socket.on('surgery:new_referral', ({ message }) => {
      toast.info(
        <div className="flex items-center gap-3">
          <Syringe size={20} className="text-white" />
          <span className="font-semibold text-sm">{message}</span>
        </div>, {
          position: 'bottom-right',
          autoClose: 6000,
          icon: false,
        }
      );
    });

    // ── Surgery Coordinator: payment received ──
    socket.on('surgery:payment_received', ({ message }) => {
      toast.success(
        <div className="flex items-center gap-3">
          <DollarSign size={20} className="text-white" />
          <span className="font-semibold text-sm">{message}</span>
        </div>, {
          position: 'bottom-right',
          autoClose: 6000,
          icon: false,
        }
      );
    });

    // ── Backup notifications ──
    socket.on('backup:done', ({ file }) => {
      toast.success(
        <div className="flex items-center gap-3">
          <Database size={20} className="text-white" />
          <span className="font-semibold text-sm">نسخ احتياطي: {file}</span>
        </div>, { autoClose: 8000, icon: false }
      );
    });
    socket.on('backup:failed', ({ message }) => {
      toast.error(
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="text-white" />
          <span className="font-semibold text-sm">{message}</span>
        </div>, { autoClose: 8000, icon: false }
      );
    });

    // ── Silent Hydration Events ──
    socket.on('patient:updated', (data = {}) => setSilentUpdate(data));
    socket.on('lab:update', (data = {}) => setSilentUpdate(data));
    socket.on('radiology:updated', (data = {}) => setSilentUpdate(data));

    return () => {
      socket.off('patient:registered');
      socket.off('patient:waiting');
      socket.off('request:new');
      socket.off('lab:completed');
      socket.off('radiology:completed');
      socket.off('surgery:new_referral');
      socket.off('surgery:payment_received');
      socket.off('backup:done');
      socket.off('backup:failed');
      socket.off('patient:updated');
      socket.off('lab:update');
      socket.off('radiology:updated');
    };
  }, [role]);
};

export default useRealtimeNotifications;
