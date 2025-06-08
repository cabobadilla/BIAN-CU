import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Users, 
  Settings, 
  Edit3, 
  Save, 
  X, 
  UserPlus,
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown
} from 'lucide-react';
import { companyService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Company, CompanyUser } from '../types';

const CompanyPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'info' | 'users' | 'settings'>('info');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', domain: '' });

  // Consultar información de la empresa
  const { data: companyResponse, isLoading: companyLoading } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyService.getCurrent(),
  });

  // Consultar usuarios de la empresa
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['companyUsers'],
    queryFn: () => companyService.getUsers(),
  });

  const company: Company = companyResponse?.data?.data as Company;
  const users: CompanyUser[] = (usersResponse?.data?.data as CompanyUser[]) || [];

  // Mutaciones
  const updateCompanyMutation = useMutation({
    mutationFn: (data: Partial<Company>) => companyService.updateCurrent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      setIsEditingInfo(false);
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => 
      companyService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyUsers'] });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => 
      companyService.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyUsers'] });
    },
  });

  if (companyLoading) {
    return <LoadingSpinner />;
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar la empresa</h2>
        <p className="text-gray-600">No se pudo cargar la información de la empresa.</p>
      </div>
    );
  }

  const handleEditInfo = () => {
    setEditForm({ name: company.name, domain: company.domain || '' });
    setIsEditingInfo(true);
  };

  const handleSaveInfo = () => {
    updateCompanyMutation.mutate(editForm);
  };

  const handleCancelEdit = () => {
    setIsEditingInfo(false);
    setEditForm({ name: '', domain: '' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    { id: 'info', label: 'Información', icon: Building2 },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Empresa</h1>
          <p className="text-gray-600 mt-1">
            Administra la información y usuarios de tu empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-semibold text-gray-900">{company.name}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'info' | 'users' | 'settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Información de la Empresa</h3>
              {isAdmin && (
                <>
                  {isEditingInfo ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveInfo}
                        disabled={updateCompanyMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        {updateCompanyMutation.isPending ? <LoadingSpinner /> : <Save className="h-4 w-4" />}
                        Guardar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEditInfo}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nombre de la empresa
                  </label>
                  {isEditingInfo ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre de la empresa"
                    />
                  ) : (
                    <p className="text-gray-900 text-lg">{company.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Dominio
                  </label>
                  {isEditingInfo ? (
                    <input
                      type="text"
                      value={editForm.domain}
                      onChange={(e) => setEditForm(prev => ({ ...prev, domain: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ejemplo.com"
                    />
                  ) : (
                    <p className="text-gray-900">{company.domain || 'No especificado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Total de usuarios
                  </label>
                  <p className="text-gray-900">{users.length} usuarios</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Fecha de creación
                  </label>
                  <p className="text-gray-900">{formatDate(company.createdAt)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Última actualización
                  </label>
                  <p className="text-gray-900">{formatDate(company.updatedAt)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    ID de la empresa
                  </label>
                  <p className="text-gray-900 font-mono text-sm">{company._id}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Usuarios de la Empresa</h3>
              {isAdmin && (
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invitar Usuario
                </button>
              )}
            </div>

            {usersLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Último acceso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Se unió
                      </th>
                      {isAdmin && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <tr key={userItem._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {userItem.picture ? (
                                <img 
                                  className="h-10 w-10 rounded-full" 
                                  src={userItem.picture} 
                                  alt={userItem.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-gray-600 font-medium">
                                    {userItem.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                                {userItem._id === user?.id && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {userItem.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            userItem.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {userItem.role === 'admin' ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                            {userItem.role === 'admin' ? 'Administrador' : 'Usuario'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {userItem.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {userItem.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userItem.lastLogin ? new Date(userItem.lastLogin).toLocaleDateString('es-ES') : 'Nunca'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(userItem.joinedAt).toLocaleDateString('es-ES')}
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {userItem._id !== user?.id && (
                              <div className="flex items-center gap-2">
                                <select
                                  value={userItem.role}
                                  onChange={(e) => updateUserRoleMutation.mutate({ 
                                    userId: userItem._id, 
                                    role: e.target.value as 'admin' | 'user' 
                                  })}
                                  className="text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="user">Usuario</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <button
                                  onClick={() => updateUserStatusMutation.mutate({ 
                                    userId: userItem._id, 
                                    isActive: !userItem.isActive 
                                  })}
                                  className={`text-xs px-2 py-1 rounded ${
                                    userItem.isActive 
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  {userItem.isActive ? 'Desactivar' : 'Activar'}
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {users.length === 0 && !usersLoading && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
                <p className="text-gray-600">No se encontraron usuarios en esta empresa.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Configuración de la Empresa</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Configuraciones generales */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Configuraciones Generales</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Máximo de casos de uso
                    </label>
                    <p className="text-gray-900">{company.settings.maxUseCases}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Dominios permitidos
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {company.settings.allowedDomains.length > 0 ? (
                        company.settings.allowedDomains.map((domain, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            {domain}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">Todos los dominios permitidos</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Funcionalidades */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Funcionalidades Habilitadas</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Análisis con IA</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      company.settings.features.aiAnalysis 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.settings.features.aiAnalysis ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {company.settings.features.aiAnalysis ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Schemas personalizados</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      company.settings.features.customSchemas 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.settings.features.customSchemas ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {company.settings.features.customSchemas ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Fuentes de datos</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      company.settings.features.dataSources 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.settings.features.dataSources ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {company.settings.features.dataSources ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="pt-6 border-t border-gray-200">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Modificar Configuración
                </button>
              </div>
            )}

            {!isAdmin && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Permisos limitados</span>
                </div>
                <p className="text-yellow-700 mt-1">
                  Solo los administradores pueden modificar la configuración de la empresa.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyPage; 