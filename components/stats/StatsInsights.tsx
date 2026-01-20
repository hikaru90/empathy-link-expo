import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Trash } from 'lucide-react-native';
import { deleteMemory, deleteMemories } from '@/lib/api/memories';

interface Memory {
  id: string;
  type: string;
  key: string;
  value: string;
  confidence: 'certain' | 'likely' | 'uncertain';
}

interface StatsInsightsProps {
  data: Memory[];
  onMemoriesUpdated?: () => void;
}

export default function StatsInsights({ data, onMemoriesUpdated }: StatsInsightsProps) {
  const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const relationshipInsights = data.filter(
    (memory) => memory.type === 'relationship' || memory.type === 'identity'
  );

  const selectMemory = (id: string) => {
    if (selectedMemories.includes(id)) {
      setSelectedMemories(selectedMemories.filter((memId) => memId !== id));
    } else {
      setSelectedMemories([...selectedMemories, id]);
    }
  };

  const handleDeleteMemories = async () => {
    if (selectedMemories.length === 0) return;

    console.log(`[StatsInsights] Deleting ${selectedMemories.length} memories:`, selectedMemories);
    try {
      setIsDeleting(true);
      await deleteMemories(selectedMemories);
      console.log('[StatsInsights] Bulk delete successful');
      setSelectedMemories([]);
      onMemoriesUpdated?.();
    } catch (error) {
      console.error('[StatsInsights] Failed to delete memories:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async (memoryId: string) => {
    console.log('[StatsInsights] handleDeleteSingle called with ID:', memoryId);
    try {
      console.log('[StatsInsights] Calling deleteMemory API with ID:', memoryId);
      const result = await deleteMemory(memoryId);
      console.log('[StatsInsights] Delete API call successful, result:', result);
      onMemoriesUpdated?.();
      console.log('[StatsInsights] onMemoriesUpdated callback called');
    } catch (error) {
      console.error('[StatsInsights] Failed to delete memory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('[StatsInsights] Error details:', {
        message: errorMessage,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
        memoryId,
      });
    }
  };

  return (
    <View>
      <View style={styles.headerActions}>
        {selectedMemories.length > 0 && (
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDeleteMemories}
            disabled={isDeleting}
          >
            <Text style={styles.deleteButtonText}>löschen</Text>
            <Trash size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.container}>
        {relationshipInsights.map((memory, index) => (
          <View
            key={memory.id}
            style={[
              styles.memoryItem,
              index === relationshipInsights.length - 1 && styles.lastMemoryItem,
            ]}
          >
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => selectMemory(memory.id)}
            >
              <View style={styles.checkboxCircle}>
                {selectedMemories.includes(memory.id) ? (
                  <Check size={12} color="#000" />
                ) : (
                  <View style={{ width: 12, height: 12 }} />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.memoryContent}>
              <Text style={styles.memoryKey}>{memory.key}</Text>
              <Text style={styles.memoryValue}>{memory.value}</Text>
            </View>

            <TouchableOpacity
              style={styles.deleteIconButton}
              onPress={() => handleDeleteSingle(memory.id)}
            >
              <Trash size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    height: 32,
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 4,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 20,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  container: {
    marginBottom: 64,
  },
  memoryItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    borderRadius: 22,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.02)',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
  },
  lastMemoryItem: {
    borderBottomWidth: 0,
  },
  checkbox: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.02)',
    paddingVertical: 8,
    paddingRight: 4,
    justifyContent: 'flex-start',
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  memoryContent: {
    flex: 1,
    paddingVertical: 8,
    gap: 8,
  },
  deleteIconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.02)',
  },
  memoryKey: {
    marginBottom: 8,
    color: '#666',
    fontSize: 14,
  },
  memoryValue: {
    marginBottom: 8,
    fontSize: 14,
    color: '#000',
  },
});
