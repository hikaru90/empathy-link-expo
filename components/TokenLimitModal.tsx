import { getTokenLimitMessage, TOKEN_LIMIT_CONTACT_EMAIL } from '@/lib/tokenLimit';
import React from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import baseColors from '@/baseColors.config';

interface TokenLimitModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TokenLimitModal({ visible, onClose }: TokenLimitModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.message}>{getTokenLimitMessage()}</Text>
          <TouchableOpacity
            style={styles.mailButton}
            onPress={() => Linking.openURL(`mailto:${TOKEN_LIMIT_CONTACT_EMAIL}`)}
          >
            <Text style={styles.mailButtonText}>E-Mail schreiben</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Schließen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: baseColors.offwhite,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  mailButton: {
    backgroundColor: baseColors.forest,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  mailButtonText: {
    fontSize: 16,
    color: baseColors.offwhite,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});
