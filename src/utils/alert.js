// Alert que funciona tanto no Android quanto na Web

import { Platform, Alert as RNAlert } from 'react-native';

export const Alert = {
  alert: (title, message, buttons = [{ text: 'OK' }]) => {
    if (Platform.OS === 'web') {
      // Na web, usa window.confirm ou window.alert
      
      if (buttons.length === 1) {
        // Apenas um botão - usa alert simples
        window.alert(`${title}\n\n${message}`);
        if (buttons[0].onPress) buttons[0].onPress();
      } else {
        // Múltiplos botões - usa confirm
        const confirmMessage = `${title}\n\n${message}`;
        const result = window.confirm(confirmMessage);
        
        // Procura botão de confirmação e cancelamento
        const confirmButton = buttons.find(b => 
          b.style !== 'cancel' && b.style !== 'destructive'
        ) || buttons.find(b => b.style === 'destructive');
        
        const cancelButton = buttons.find(b => b.style === 'cancel');
        
        if (result && confirmButton && confirmButton.onPress) {
          confirmButton.onPress();
        } else if (!result && cancelButton && cancelButton.onPress) {
          cancelButton.onPress();
        }
      }
    } else {
      // No Android/iOS usa o Alert nativo
      RNAlert.alert(title, message, buttons);
    }
  }
};