import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { toast } from '@/core/ui/ToastContext';

export async function handleOpenReceipt(uri?: string | null, fileName?: string | null) {
  if (!uri || !uri.trim()) {
    toast.warning('Sin comprobante', 'Esta operación no tiene un comprobante de pago adjunto.');
    return;
  }

  const cleanUri = uri.trim();
  toast.info('Abriendo comprobante', fileName ? `Cargando ${fileName}...` : 'Abriendo archivo adjunto...');

  try {
    if (Platform.OS === 'web' || typeof window !== 'undefined') {
      // En Web/Tauri: Abrir en pestaña nueva externa o forzar descarga
      const newTab = window.open(cleanUri, '_blank');
      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        // Si el navegador bloqueó el popup, crear enlace temporal de descarga/apertura
        const link = document.createElement('a');
        link.href = cleanUri;
        link.target = '_blank';
        if (fileName) link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      // En Móvil: Usar WebBrowser o Linking del sistema
      if (cleanUri.startsWith('http://') || cleanUri.startsWith('https://')) {
        await WebBrowser.openBrowserAsync(cleanUri);
      } else {
        const canOpen = await Linking.canOpenURL(cleanUri);
        if (canOpen) {
          await Linking.openURL(cleanUri);
        } else {
          toast.error('Error', 'No se puede abrir este tipo de archivo en el dispositivo.');
        }
      }
    }
  } catch (err) {
    console.error('Error al abrir comprobante:', err);
    toast.error('Error al abrir comprobante', 'No se pudo visualizar el archivo adjunto.');
  }
}
