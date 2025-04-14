import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import logoSalt from '../../assets/logo_salt.png'
import * as S from './style'

function ListaChamados() {
  const [chamados, setChamados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Verifica se existe um token de autenticação
    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Você precisa fazer login para acessar esta página', {
        position: "top-right",
        autoClose: 5000
      })
      navigate('/')
      return
    }
    
    // Configura o axios com os headers necessários
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    
    fetchChamados()
  }, [navigate])

  const fetchChamados = async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        'https://integrador.in.saltsystems.com.br/webhook/kaua/listar-chamados'
      )
      
      if (!response.data) {
        throw new Error('Resposta vazia da API')
      }

      // Garante que estamos trabalhando com um array de chamados
      let chamadosArray = []
      if (Array.isArray(response.data)) {
        chamadosArray = response.data
      } else if (typeof response.data === 'object') {
        chamadosArray = [response.data]
      }

      // Mapeia os chamados sem nenhum filtro
      const todosOsChamados = chamadosArray.map(chamado => ({
        ...chamado,
        createdby: chamado.createdby || chamado.dev?.[0] || { 
          display_name: chamado.autorizador || 'N/A',
          email: chamado.autorizador || 'N/A'
        }
      }))

      setChamados(todosOsChamados)
      setError(null)
    } catch (error) {
      let mensagemErro = 'Não foi possível carregar os chamados.'
      
      if (error.response) {
        if (error.response.status === 401) {
          mensagemErro = 'Sessão expirada. Por favor, faça login novamente.'
          localStorage.removeItem('authToken')
          navigate('/')
        } else if (error.response.status === 500) {
          mensagemErro = 'Erro interno do servidor. Por favor, tente novamente mais tarde.'
        } else if (error.response.data?.message) {
          mensagemErro = error.response.data.message
        }
      } else if (error.request) {
        mensagemErro = 'Não foi possível conectar ao servidor. Verifique sua conexão.'
      }
      
      setError(mensagemErro)
      toast.error(mensagemErro, {
        position: "top-right",
        autoClose: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNovoChamado = () => {
    navigate('/criar-chamado')
  }

  const handleAtualizar = () => {
    fetchChamados()
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    delete axios.defaults.headers.common['Authorization']
    navigate('/')
  }

  if (loading) {
    return <S.LoadingMessage>Carregando chamados...</S.LoadingMessage>
  }

  return (
    <S.Container>
      <S.Header>
        <S.Logo src={logoSalt} alt="Salt Systems" />
        <S.Title>Lista de Chamados</S.Title>
        <S.ButtonContainer>
          <S.Button onClick={handleNovoChamado}>Novo Chamado</S.Button>
          <S.Button onClick={handleAtualizar}>Atualizar</S.Button>
          <S.Button onClick={handleLogout}>Sair</S.Button>
        </S.ButtonContainer>
      </S.Header>

      {error ? (
        <S.ErrorMessage>{error}</S.ErrorMessage>
      ) : (
        <S.Table>
          <thead>
            <tr>
              <S.Th>ID</S.Th>
              <S.Th>Projeto</S.Th>
              <S.Th>Descrição</S.Th>
              <S.Th>Status</S.Th>
              <S.Th>Prioridade</S.Th>
              <S.Th>Solicitante</S.Th>
              <S.Th>Data de Abertura</S.Th>
            </tr>
          </thead>
          <tbody>
            {chamados.length === 0 ? (
              <S.Tr>
                <S.Td colSpan="7" style={{ textAlign: 'center' }}>
                  Nenhum chamado pendente encontrado
                </S.Td>
              </S.Tr>
            ) : (
              chamados.map(chamado => (
                <S.Tr key={chamado.Id}>
                  <S.Td>{chamado.Id}</S.Td>
                  <S.Td>{chamado.projeto}</S.Td>
                  <S.Td>{chamado.descricao}</S.Td>
                  <S.Td>
                    <S.Status status={chamado.status}>
                      {chamado.status === 'pendente-salt' ? 'Pendente' : chamado.status}
                    </S.Status>
                  </S.Td>
                  <S.Td>
                    <S.Priority priority={chamado.prioridade}>
                      {chamado.prioridade}
                    </S.Priority>
                  </S.Td>
                  <S.Td>
                    {chamado.email_solicitacao || 'N/A'}
                  </S.Td>
                  <S.Td>
                    {new Date(chamado.created).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </S.Td>
                </S.Tr>
              ))
            )}
          </tbody>
        </S.Table>
      )}
    </S.Container>
  )
}

export default ListaChamados 