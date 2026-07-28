import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { toast } from '@/core/ui/ToastContext';

function guessMimeFromName(fileName?: string | null): string {
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

/** Normaliza base64 crudo o data URI a un data URI válido. */
export function toDataUri(uri: string, fileName?: string | null, mimeHint?: string | null): string {
  const clean = uri.trim();
  if (clean.startsWith('data:')) return clean;
  // Base64 crudo (sin prefijo)
  if (/^[A-Za-z0-9+/=\s]+$/.test(clean) && clean.replace(/\s/g, '').length > 64) {
    const mime = mimeHint || guessMimeFromName(fileName);
    return `data:${mime};base64,${clean.replace(/\s/g, '')}`;
  }
  return clean;
}

function openDataUriInBrowser(dataUri: string, fileName?: string | null) {
  const byteString = atob(dataUri.split(',')[1] || '');
  const mimeMatch = /^data:([^;,]+)/.exec(dataUri);
  const mime = mimeMatch?.[1] || guessMimeFromName(fileName);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i += 1) {
    bytes[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mime });
  const objectUrl = URL.createObjectURL(blob);

  const opened = window.open(objectUrl, '_blank');
  if (!opened || opened.closed || typeof opened.closed === 'undefined') {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    if (fileName) link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Liberar memoria un poco después de abrir
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function handleOpenReceipt(uri?: string | null, fileName?: string | null) {
  if (!uri || !uri.trim()) {
    toast.warning('Sin comprobante', 'Esta operación no tiene un comprobante de pago adjunto.');
    return;
  }

  const cleanUri = toDataUri(uri, fileName);
  toast.info('Abriendo comprobante', fileName ? `Cargando ${fileName}...` : 'Abriendo archivo adjunto...');

  try {
    const isWeb = Platform.OS === 'web' || typeof window !== 'undefined';

    if (isWeb) {
      if (cleanUri.startsWith('blob:')) {
        // blob: suele expirar al recargar — avisar
        const opened = window.open(cleanUri, '_blank');
        if (!opened) {
          toast.error(
            'No se pudo abrir',
            'El archivo temporal ya no está disponible. Volvé a adjuntar el comprobante.',
          );
        }
        return;
      }

      if (cleanUri.startsWith('data:')) {
        openDataUriInBrowser(cleanUri, fileName);
        return;
      }

      if (cleanUri.startsWith('http://') || cleanUri.startsWith('https://')) {
        const opened = window.open(cleanUri, '_blank');
        if (!opened) {
          const link = document.createElement('a');
          link.href = cleanUri;
          link.target = '_blank';
          link.rel = 'noopener';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        return;
      }

      // file:// u otros: intentar descarga/apertura directa
      const link = document.createElement('a');
      link.href = cleanUri;
      link.target = '_blank';
      if (fileName) link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Móvil nativo
    if (cleanUri.startsWith('http://') || cleanUri.startsWith('https://')) {
      await WebBrowser.openBrowserAsync(cleanUri);
      return;
    }

    if (cleanUri.startsWith('data:')) {
      // En native data URI: Linking a veces falla; intentar de todos modos
      const canOpen = await Linking.canOpenURL(cleanUri);
      if (canOpen) {
        await Linking.openURL(cleanUri);
      } else {
        toast.error('Error', 'No se puede abrir este comprobante en el dispositivo. Probá desde la versión web/desktop.');
      }
      return;
    }

    const canOpen = await Linking.canOpenURL(cleanUri);
    if (canOpen) {
      await Linking.openURL(cleanUri);
    } else {
      toast.error('Error', 'No se puede abrir este tipo de archivo en el dispositivo.');
    }
  } catch (err) {
    console.error('Error al abrir comprobante:', err);
    toast.error('Error al abrir comprobante', 'No se pudo visualizar el archivo adjunto.');
  }
}
