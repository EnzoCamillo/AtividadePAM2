import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  Modal,
  ScrollView,
  ListRenderItem,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface Cliente {
  id: number;
  Nome: string;
  Idade: number;
  UF: string;
}

interface FormData {
  Nome: string;
  Idade: string;
  UF: string;
}

const API_BASE_URL = 'http://localhost:3000';

const App: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<FormData>({
    Nome: '',
    Idade: '',
    UF: ''
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('Tentando conectar em:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Cliente[] = await response.json();
      console.log('Dados recebidos:', data);
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro detalhado:', error);
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          Alert.alert('Erro', 'Timeout: Verifique se a API está rodando e o IP está correto.');
        } else if (error.message.includes('Network request failed')) {
          Alert.alert('Erro de Conexão', `Não foi possível conectar com a API.\n\nVerifique:\n• Se a API está rodando na porta 3000\n• Se o IP ${API_BASE_URL} está correto\n• Se você está na mesma rede`);
        } else {
          Alert.alert('Erro', `Falha na conexão: ${error.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.Nome.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return false;
    }
    
    if (!formData.Idade.trim()) {
      Alert.alert('Erro', 'Idade é obrigatória');
      return false;
    }
    
    const idade = parseInt(formData.Idade);
    if (isNaN(idade) || idade < 0 || idade > 150) {
      Alert.alert('Erro', 'Digite uma idade válida (0-150)');
      return false;
    }
    
    if (!formData.UF.trim()) {
      Alert.alert('Erro', 'UF é obrigatória');
      return false;
    }
    
    if (formData.UF.length !== 2) {
      Alert.alert('Erro', 'UF deve ter exatamente 2 caracteres');
      return false;
    }
    
    return true;
  };

  const createCliente = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          Nome: formData.Nome.trim(),
          Idade: parseInt(formData.Idade),
          UF: formData.UF.trim().toUpperCase()
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Cliente criado com sucesso!');
        resetForm();
        await fetchClientes();
      } else {
        const errorData = await response.text();
        console.error('Erro na API:', errorData);
        Alert.alert('Erro', 'Não foi possível criar o cliente');
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      Alert.alert('Erro', 'Erro de conexão. Verifique se a API está funcionando.');
    }
  };

  const updateCliente = async (): Promise<void> => {
    if (!editingCliente || !validateForm()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/clientes/${editingCliente.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          Nome: formData.Nome.trim(),
          Idade: parseInt(formData.Idade),
          UF: formData.UF.trim().toUpperCase()
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Cliente atualizado com sucesso!');
        resetForm();
        await fetchClientes();
      } else {
        const errorData = await response.text();
        console.error('Erro na API:', errorData);
        Alert.alert('Erro', 'Não foi possível atualizar o cliente');
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      Alert.alert('Erro', 'Erro de conexão. Verifique se a API está funcionando.');
    }
  };

  const confirmDeleteCliente = (cliente: Cliente): void => {
    setDeletingCliente(cliente);
    setDeleteModalVisible(true);
  };

  const deleteCliente = async (): Promise<void> => {
    if (!deletingCliente) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 8000);

      const response = await fetch(`${API_BASE_URL}/clientes/${deletingCliente.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        Alert.alert('Sucesso', 'Cliente deletado com sucesso!');
        closeDeleteModal();
        await fetchClientes();
      } else {
        const errorData = await response.text();
        console.error('Erro na API:', errorData);
        Alert.alert('Erro', 'Não foi possível deletar o cliente');
        closeDeleteModal();
      }
    } catch (error: any) {
      console.error('Erro ao deletar cliente:', error);
      closeDeleteModal();
      if (error.name === 'AbortError') {
        Alert.alert('Timeout', 'A operação demorou muito para responder.');
      } else {
        Alert.alert('Erro', 'Erro de conexão. Verifique se a API está funcionando.');
      }
    }
  };

  const resetForm = (): void => {
    setFormData({ Nome: '', Idade: '', UF: '' });
    setEditingCliente(null);
    setModalVisible(false);
  };

  const closeDeleteModal = (): void => {
    setDeletingCliente(null);
    setDeleteModalVisible(false);
  };

  const openEditModal = (cliente: Cliente): void => {
    setEditingCliente(cliente);
    setFormData({
      Nome: cliente.Nome,
      Idade: cliente.Idade.toString(),
      UF: cliente.UF
    });
    setModalVisible(true);
  };

  const openCreateModal = (): void => {
    setEditingCliente(null);
    setFormData({ Nome: '', Idade: '', UF: '' });
    setModalVisible(true);
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderClienteItem: ListRenderItem<Cliente> = ({ item }) => (
    <View style={styles.clienteItem}>
      <View style={styles.clienteInfo}>
        <Text style={styles.clienteNome} numberOfLines={1}>{item.Nome}</Text>
        <View style={styles.clienteDetalhesContainer}>
          <Text style={styles.clienteDetalhes}>{item.Idade} anos</Text>
          <Text style={styles.clienteDetalhes}>• {item.UF}</Text>
        </View>
      </View>
      <View style={styles.clienteActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => confirmDeleteCliente(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const CustomInput: React.FC<{
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'numeric';
    maxLength?: number;
  }> = ({ label, value, onChangeText, placeholder, keyboardType = 'default', maxLength }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}:</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={keyboardType === 'default' ? 'words' : 'none'}
        placeholderTextColor="#999"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreateModal}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={clientes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderClienteItem}
        refreshing={loading}
        onRefresh={fetchClientes}
        style={styles.list}
        contentContainerStyle={[
          styles.listContainer,
          clientes.length === 0 ? styles.emptyContainer : undefined
        ]}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>📝</Text>
            <Text style={styles.emptyText}>
              {loading ? 'Carregando...' : 'Nenhum cliente encontrado'}
            </Text>
            {!loading && (
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={fetchClientes}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>🔄 Tentar novamente</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={resetForm}
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCliente ? '✏️ Editar Cliente' : '➕ Novo Cliente'}
              </Text>
              <TouchableOpacity onPress={resetForm} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <CustomInput
                label="Nome Completo"
                value={formData.Nome}
                onChangeText={(text) => handleInputChange('Nome', text)}
                placeholder="Ex: João da Silva"
                maxLength={100}
              />

              <View style={styles.rowInputs}>
                <View style={styles.ageInput}>
                  <CustomInput
                    label="Idade"
                    value={formData.Idade}
                    onChangeText={(text) => handleInputChange('Idade', text)}
                    placeholder="Ex: 30"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>

                <View style={styles.ufInput}>
                  <CustomInput
                    label="Estado (UF)"
                    value={formData.UF}
                    onChangeText={(text) => handleInputChange('UF', text.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={resetForm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={editingCliente ? updateCliente : createCliente}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>
                    {editingCliente ? 'Atualizar' : 'Salvar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={closeDeleteModal}
        statusBarTranslucent={true}
      >
        <View style={styles.deleteModalContainer}>
          <View style={styles.deleteModalContent}>
            
            <Text style={styles.deleteModalTitle}>Confirmar Exclusão</Text>
            
            <Text style={styles.deleteModalMessage}>
              Tem certeza que deseja excluir o cliente:
            </Text>
            
            {deletingCliente && (
              <View style={styles.clienteInfoDelete}>
                <Text style={styles.clienteNameDelete}>
                  {deletingCliente.Nome}
                </Text>
                <Text style={styles.clienteDetailsDelete}>
                  {deletingCliente.Idade} anos • {deletingCliente.UF}
                </Text>
              </View>
            )}
            
            <Text style={styles.deleteWarningText}>
              Esta ação não pode ser desfeita.
            </Text>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteCancelButton]}
                onPress={closeDeleteModal}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteModalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteConfirmButton]}
                onPress={deleteCliente}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteModalButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1976D2',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: Math.min(width * 0.055, 22),
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: Math.min(width * 0.035, 14),
  },
  list: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.015,
    paddingBottom: height * 0.02,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: width * 0.08,
  },
  emptyStateIcon: {
    fontSize: width * 0.15,
    marginBottom: height * 0.02,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: Math.min(width * 0.04, 16),
    color: '#666',
    marginBottom: height * 0.02,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.015,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: Math.min(width * 0.035, 14),
    fontWeight: 'bold',
  },
  clienteItem: {
    backgroundColor: 'white',
    padding: width * 0.04,
    marginBottom: height * 0.012,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  clienteInfo: {
    flex: 1,
    marginRight: width * 0.03,
  },
  clienteNome: {
    fontSize: Math.min(width * 0.045, 18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.005,
  },
  clienteDetalhesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clienteDetalhes: {
    fontSize: Math.min(width * 0.035, 14),
    color: '#666',
    marginRight: width * 0.02,
  },
  clienteActions: {
    flexDirection: 'row',
    gap: width * 0.02,
  },
  actionButton: {
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.01,
    borderRadius: 8,
    minWidth: width * 0.12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    fontSize: Math.min(width * 0.04, 16),
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: width * 0.05,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: height * 0.85,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.025,
    paddingBottom: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: Math.min(width * 0.05, 20),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: width * 0.02,
  },
  closeButtonText: {
    fontSize: Math.min(width * 0.06, 24),
    color: '#666',
    fontWeight: 'bold',
  },
  modalScrollContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
  },
  inputGroup: {
    marginBottom: height * 0.02,
  },
  inputLabel: {
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.008,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: width * 0.03,
    borderRadius: 8,
    fontSize: Math.min(width * 0.04, 16),
    backgroundColor: '#fafafa',
    minHeight: height * 0.06,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: width * 0.03,
  },
  ageInput: {
    flex: 1,
  },
  ufInput: {
    width: width * 0.25,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: height * 0.03,
    gap: width * 0.03,
  },
  modalButton: {
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.018,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    minHeight: height * 0.06,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#757575',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: 'white',
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: 'bold',
  },
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: width * 0.08,
  },
  deleteModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: height * 0.03,
    paddingHorizontal: width * 0.06,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    width: '100%',
    maxWidth: 400,
  },
  deleteModalIcon: {
    marginBottom: height * 0.02,
  },
  deleteIconText: {
    fontSize: width * 0.15,
  },
  deleteModalTitle: {
    fontSize: Math.min(width * 0.055, 22),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: height * 0.015,
  },
  deleteModalMessage: {
    fontSize: Math.min(width * 0.04, 16),
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.015,
    lineHeight: 24,
  },
  clienteInfoDelete: {
    backgroundColor: '#f8f9fa',
    padding: width * 0.04,
    borderRadius: 12,
    marginVertical: height * 0.015,
    width: '100%',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  clienteNameDelete: {
    fontSize: Math.min(width * 0.045, 18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.005,
    textAlign: 'center',
  },
  clienteDetailsDelete: {
    fontSize: Math.min(width * 0.035, 14),
    color: '#666',
    textAlign: 'center',
  },
  deleteWarningText: {
    fontSize: Math.min(width * 0.035, 14),
    color: '#F44336',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: height * 0.025,
  },
  deleteModalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: width * 0.03,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: height * 0.018,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.06,
  },
  deleteCancelButton: {
    backgroundColor: '#757575',
  },
  deleteConfirmButton: {
    backgroundColor: '#F44336',
  },
  deleteModalButtonText: {
    color: 'white',
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: 'bold',
  },
});

export default App;