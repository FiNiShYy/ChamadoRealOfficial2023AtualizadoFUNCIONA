import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import ReCAPTCHA from "react-google-recaptcha"
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import logoSalt from '../../assets/logo_salt.png'
import * as S from './style'

function Form() {
  const [formData, setFormData] = useState({
    email: 'a@kitei.com.br',
    password: '',
    descricao: '',
    projeto: '',
    autorizador: ''
  })

  const [loading, setLoading] = useState(false)
  const [isEmailValid, setIsEmailValid] = useState(false)
  const [cliente, setCliente] = useState('')
  const [projects, setProjects] = useState([])
  const [autorizadores, setAutorizadores] = useState([])
  const [customAutorizador, setCustomAutorizador] = useState(false)
  const [selectedAutorizador, setSelectedAutorizador] = useState('')
  const [recaptchaValue, setRecaptchaValue] = useState(null)
  const [tentativasValidacao, setTentativasValidacao] = useState(() => {
    const saved = localStorage.getItem('tentativasValidacao')
    return saved ? parseInt(saved) : 0
  })
  const [emailBloqueado, setEmailBloqueado] = useState(() => {
    const saved = localStorage.getItem('emailBloqueado')
    return saved === 'true'
  })
  const [senhaBloqueado, setSenhaBloqueado] = useState(() => {
    const saved = localStorage.getItem('senhaBloqueado')
    return saved === 'true'
  })
  const [tempoRestante, setTempoRestante] = useState(() => {
    const saved = localStorage.getItem('bloqueioExpiraEm')
    if (!saved) return 0
    const tempoRestante = Math.max(0, Math.floor((parseInt(saved) - Date.now()) / 1000))
    if (tempoRestante > 0) {
      return tempoRestante
    }
    return 0
  })
  const [authToken, setAuthToken] = useState(() => {
    const saved = localStorage.getItem('authToken')
    return saved || null
  })

  const timerRef = useRef(null)
  const navigate = useNavigate()

  // Verifica se há um bloqueio ativo ao carregar o componente
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const currentPath = window.location.pathname

    // Se estiver na rota de criar chamado e não tiver token, redireciona para login
    if (currentPath === '/criar-chamado' && !token) {
      toast.error('Você precisa fazer login para criar um chamado', {
        position: "top-right",
        autoClose: 5000
      })
      navigate('/')
      return
    }

    // Se tiver token e estiver na rota inicial, redireciona para lista de chamados
    if (token && currentPath === '/') {
      navigate('/chamados')
      return
    }

    const bloqueioExpiraEm = localStorage.getItem('bloqueioExpiraEm')
    if (bloqueioExpiraEm) {
      const tempoRestante = Math.max(0, Math.floor((parseInt(bloqueioExpiraEm) - Date.now()) / 1000))
      if (tempoRestante > 0) {
        setEmailBloqueado(true)
        setSenhaBloqueado(true)
        iniciarTemporizador(tempoRestante)
      } else {
        // Limpa o bloqueio expirado
        localStorage.removeItem('emailBloqueado')
        localStorage.removeItem('senhaBloqueado')
        localStorage.removeItem('tentativasValidacao')
        localStorage.removeItem('bloqueioExpiraEm')
        setEmailBloqueado(false)
        setSenhaBloqueado(false)
        setTentativasValidacao(0)
        setTempoRestante(0)
      }
    }
  }, [navigate])

  // Função para configurar o token nas requisições
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      setAuthToken(token)
      setIsEmailValid(true) // Marca o email como válido se tiver token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('authToken')
    }
  }, [])

  useEffect(() => {
    // Se estiver na rota de criar chamado, preenche o email com o do usuário logado
    const token = localStorage.getItem('authToken')
    const currentPath = window.location.pathname
    if (currentPath === '/criar-chamado' && token) {
      const userEmail = localStorage.getItem('userEmail')
      if (userEmail) {
        setFormData(prev => ({
          ...prev,
          email: userEmail
        }))
      }
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'autorizador' && !customAutorizador) {
      setSelectedAutorizador(value)
    }
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const iniciarTemporizador = (tempo = 300) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    const expiraEm = Date.now() + (tempo * 1000)
    localStorage.setItem('bloqueioExpiraEm', expiraEm.toString())
    setTempoRestante(tempo)
    
    timerRef.current = setInterval(() => {
      setTempoRestante(prev => {
        const novoTempo = prev - 1
        if (novoTempo <= 0) {
          clearInterval(timerRef.current)
          setEmailBloqueado(false)
          setSenhaBloqueado(false)
          setTentativasValidacao(0)
          localStorage.removeItem('emailBloqueado')
          localStorage.removeItem('tentativasValidacao')
          localStorage.removeItem('bloqueioExpiraEm')
          return 0
        }
        return novoTempo
      })
    }, 1000)
  }

  // Atualiza o localStorage quando as tentativas mudam
  useEffect(() => {
    localStorage.setItem('tentativasValidacao', tentativasValidacao.toString())
  }, [tentativasValidacao])

  // Atualiza o localStorage quando o status de bloqueio muda
  useEffect(() => {
    localStorage.setItem('emailBloqueado', emailBloqueado.toString())
  }, [emailBloqueado])

  // Limpa o timer quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const formatarTempo = (segundos) => {
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return `${minutos}:${segs.toString().padStart(2, '0')}`
  }

  const handleVoltar = () => {
    // Se o usuário estiver autenticado, volta para a lista de chamados
    if (authToken) {
      navigate('/chamados')
    } else {
      // Se não estiver autenticado, limpa o formulário
      setIsEmailValid(false)
      setCliente('')
      setProjects([])
      setAutorizadores([])
      setCustomAutorizador(false)
      setSelectedAutorizador('')
      setFormData(prevState => ({
        ...prevState,
        descricao: '',
        projeto: '',
        autorizador: ''
      }))
    }
  }

  const handleRecaptchaChange = (value) => {
    setRecaptchaValue(value)
  }

  const validateEmail = async (e) => {
    e.preventDefault()
    
    if (!recaptchaValue) {
      toast.error('Por favor, complete o reCAPTCHA antes de continuar.', {
        position: "top-right",
        autoClose: 5000,
        toastId: 'recaptchaRequired'
      })
      return
    }

    if (emailBloqueado) {
      toast.error(`Número máximo de tentativas excedido. Por favor, aguarde ${formatarTempo(tempoRestante)} antes de tentar novamente.`, {
        position: "top-right",
        autoClose: 5000,
        toastId: 'bloqueado'
      })
      return
    }
    
    if (!formData.email.includes('@') || formData.email.indexOf('@') === 0) {
      toast.warning('Digite um e-mail válido. É necessário ter um usuário antes do @.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: 'emailInvalido'
      })
      return
    }

    setLoading(true)
    try {
      const validationResponse = await axios.post(
        'https://integrador.in.saltsystems.com.br/webhook/kaua/validar-email-senha',
        { 
          email: formData.email,
          pass: formData.password
        }
      )

      if (!validationResponse.data.valid) {
        const novasTentativas = tentativasValidacao + 1
        setTentativasValidacao(novasTentativas)
        setAuthToken(null)
        
        if (novasTentativas >= 3) {
          setEmailBloqueado(true)
          setSenhaBloqueado(true)
          iniciarTemporizador()
          toast.error('Número máximo de tentativas excedido. Por favor, aguarde 5 minutos antes de tentar novamente.', {
            position: "top-right",
            autoClose: 5000,
            toastId: `maxTentativas-${Date.now()}`
          })
        } else {
          toast.error(`E-mail ou senha inválidos. Tentativas restantes: ${3 - novasTentativas}`, {
            position: "top-right",
            autoClose: 5000,
            toastId: `emailInvalido-${Date.now()}`
          })
        }
        setIsEmailValid(false)
        setLoading(false)
        return
      }

      if (validationResponse.data.token) {
        setAuthToken(validationResponse.data.token)
        localStorage.setItem('authToken', validationResponse.data.token)
        localStorage.setItem('userEmail', formData.email) // Salva o email do usuário
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${validationResponse.data.token}`
        
        toast.success('Login realizado com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          toastId: 'loginSucesso'
        })

        navigate('/chamados')
      } else {
        throw new Error('Token não recebido do servidor')
      }

    } catch (error) {
      console.error('Erro ao validar e-mail e senha:', error)
      let mensagemErro = 'Não foi possível validar o e-mail e senha.'
      
      if (error.response) {
        if (error.response.status === 500) {
          mensagemErro = 'Erro interno do servidor. Por favor, tente novamente mais tarde.'
        } else if (error.response.data?.message) {
          mensagemErro = error.response.data.message
        }
      } else if (error.request) {
        mensagemErro = 'Não foi possível conectar ao servidor. Verifique sua conexão.'
      }
      
      toast.error(mensagemErro, {
        position: "top-right",
        autoClose: 5000,
        toastId: 'erroValidacao'
      })
      setAuthToken(null)
      localStorage.removeItem('authToken')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isEmailValid) {
      toast.warning('Por favor, valide o e-mail primeiro.', {
        position: "top-right",
        autoClose: 5000
      })
      return
    }

    if (!formData.descricao.trim() || !formData.projeto || !formData.autorizador) {
      toast.warning('Por favor, preencha todos os campos.', {
        position: "top-right",
        autoClose: 5000
      })
      return
    }

    try {
      setLoading(true)
      await axios.post(
        'https://integrador.in.saltsystems.com.br/webhook-test/kaua/abrir-chamado',
        {
          email: formData.email,
          cliente,
          descricao: formData.descricao,
          projeto: formData.projeto,
          autorizador: formData.autorizador
        }
      )
      
      toast.success('Chamado criado com sucesso!', {
        position: "top-right",
        autoClose: 3000
      })
      
      // Redireciona para a lista de chamados após criar um novo chamado
      navigate('/chamados')
    } catch (err) {
      console.error('Erro ao enviar chamado:', err)
      let mensagemErro = 'Erro ao criar o chamado. Por favor, tente novamente.'
      
      if (err.response) {
        if (err.response.status === 500) {
          mensagemErro = 'Erro interno do servidor ao criar o chamado. Por favor, tente novamente mais tarde.'
        } else if (err.response.data?.message) {
          mensagemErro = err.response.data.message
        }
      } else if (err.request) {
        mensagemErro = 'Não foi possível conectar ao servidor. Verifique sua conexão.'
      }
      
      toast.error(mensagemErro, {
        position: "top-right",
        autoClose: 5000,
        toastId: 'erroChamado'
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para navegar para a lista de chamados
  const handleVerChamados = () => {
    if (authToken) {
      navigate('/chamados')
    } else {
      toast.warning('Por favor, faça login primeiro para ver os chamados.', {
        position: "top-right",
        autoClose: 5000
      })
    }
  }

  return (
    <S.FormContainer>
      <ToastContainer />
      <S.StyledCard>
        <S.LogoContainer>
          <S.Logo src={logoSalt} alt="Salt Systems" />
        </S.LogoContainer>

        <S.FormTitle>Formulário de Chamados</S.FormTitle>

        {!isEmailValid ? (
          <form onSubmit={validateEmail}>
            <S.FormGroup>
              <S.Label htmlFor="email">E-mail do cliente</S.Label>
              <S.Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={emailBloqueado}
              />
              {emailBloqueado && (
                <S.TempoRestante>
                  Tempo restante: {formatarTempo(tempoRestante)}
                </S.TempoRestante>
              )}
            </S.FormGroup>
            <S.FormGroup>
              <S.Label htmlFor="password">Senha do cliente</S.Label>
              <S.Input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={senhaBloqueado}
              />
              {senhaBloqueado && (
                <S.TempoRestante>
                  Tempo restante: {formatarTempo(tempoRestante)}
                </S.TempoRestante>
              )}
            </S.FormGroup>
            <S.RecaptchaContainer>
              <ReCAPTCHA
                sitekey="6LezeDEqAAAAACPxo_0Lmz3Nk202gUlstXI4XBt5"
                onChange={handleRecaptchaChange}
              />
            </S.RecaptchaContainer>
            <S.Button type="submit" disabled={loading || emailBloqueado}>
              {loading ? 'Validando...' : emailBloqueado ? 'Bloqueado' : 'Validar E-mail'}
            </S.Button>
          </form>
        ) : (
          <>
            <S.AlertContainer>
              <S.Alert>ℹ️ Cliente: {`${cliente} - ${formData.email}`}</S.Alert>
            </S.AlertContainer>

            <form onSubmit={handleSubmit}>
              <S.FormGroup>
                <S.Label htmlFor="projeto">Projeto</S.Label>
                <S.Select
                  id="projeto"
                  name="projeto"
                  value={formData.projeto}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Selecione o projeto</option>
                  {projects.map((projeto, index) => (
                    <option key={index} value={projeto.nomeInterno}>
                      {projeto.Nome}
                    </option>
                  ))}
                </S.Select>
              </S.FormGroup>

              <S.FormGroup>
                <S.Label htmlFor="descricao">Descrição</S.Label>
                <S.TextArea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  required
                />
              </S.FormGroup>

              <S.FormGroup>
                <S.Label htmlFor="autorizador">Autorizador</S.Label>
                <S.AutorizadorContainer>
                  <S.Select
                    id="autorizador"
                    name="autorizador"
                    value={customAutorizador ? 'outro' : selectedAutorizador}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === 'outro') {
                        setCustomAutorizador(true)
                        setSelectedAutorizador('outro')
                        setFormData(prev => ({ ...prev, autorizador: '' }))
                      } else {
                        setCustomAutorizador(false)
                        setSelectedAutorizador(value)
                        setFormData(prev => ({ ...prev, autorizador: value }))
                      }
                    }}
                    required
                  >
                    <option value="" disabled>Selecione o autorizador</option>
                    {autorizadores.map((autorizador, index) => (
                      <option key={index} value={autorizador}>
                        {autorizador}
                      </option>
                    ))}
                    <option value="outro">Outro</option>
                  </S.Select>
                  
                  {customAutorizador && (
                    <S.Input
                      type="email"
                      name="autorizador"
                      value={formData.autorizador}
                      onChange={handleChange}
                      placeholder="Digite o email do autorizador"
                      required
                    />
                  )}
                </S.AutorizadorContainer>
              </S.FormGroup>

              <S.ButtonContainer>
                <S.BackButton type="button" onClick={handleVoltar}>
                  Voltar
                </S.BackButton>
                <S.Button type="button" onClick={handleVerChamados}>
                  Ver Chamados
                </S.Button>
                <S.Button type="submit" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Chamado'}
                </S.Button>
              </S.ButtonContainer>
            </form>
          </>
        )}
      </S.StyledCard>
    </S.FormContainer>
  )
}

export default Form
 