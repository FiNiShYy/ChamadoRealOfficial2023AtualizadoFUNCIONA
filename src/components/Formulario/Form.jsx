import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import ReCAPTCHA from "react-google-recaptcha"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import logoSalt from '../../assets/logo_salt.png'
import * as S from './style'

function Form() {
  const [formData, setFormData] = useState({
    email: '',
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
  const [tempoRestante, setTempoRestante] = useState(() => {
    const saved = localStorage.getItem('bloqueioExpiraEm')
    if (!saved) return 0
    const tempoRestante = Math.max(0, Math.floor((parseInt(saved) - Date.now()) / 1000))
    if (tempoRestante > 0) {
      return tempoRestante
    }
    return 0
  })

  const timerRef = useRef(null)

  // Verifica se há um bloqueio ativo ao carregar o componente
  useEffect(() => {
    const bloqueioExpiraEm = localStorage.getItem('bloqueioExpiraEm')
    if (bloqueioExpiraEm) {
      const tempoRestante = Math.max(0, Math.floor((parseInt(bloqueioExpiraEm) - Date.now()) / 1000))
      if (tempoRestante > 0) {
        setEmailBloqueado(true)
        iniciarTemporizador(tempoRestante)
      } else {
        // Limpa o bloqueio expirado
        localStorage.removeItem('emailBloqueado')
        localStorage.removeItem('tentativasValidacao')
        localStorage.removeItem('bloqueioExpiraEm')
        setEmailBloqueado(false)
        setTentativasValidacao(0)
        setTempoRestante(0)
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
      const autorizadoresResponse = await axios.get(
        'https://integrador.in.saltsystems.com.br/webhook/kaua/getAutorizadores'
      )

      console.log('Resposta da API de autorizadores:', JSON.stringify(autorizadoresResponse.data, null, 2))

      const dominio = formData.email.split('@')[1]
      console.log('Domínio do email:', dominio)

      if (!autorizadoresResponse.data?.[0]?.list) {
        console.error('Lista de clientes não encontrada na resposta:', autorizadoresResponse.data)
        toast.error('Erro ao carregar a lista de clientes.', {
          position: "top-right",
          autoClose: 5000,
          toastId: 'erroLista'
        })
        setLoading(false)
        return
      }

      const clienteData = autorizadoresResponse.data[0].list.find(item => {
        if (!item?.host) return false
        return item.host.toLowerCase() === dominio.toLowerCase()
      })

      console.log('Dados do cliente encontrados:', clienteData)

      if (!clienteData) {
        const novasTentativas = tentativasValidacao + 1
        setTentativasValidacao(novasTentativas)
        
        if (novasTentativas >= 3) {
          setEmailBloqueado(true)
          iniciarTemporizador()
          toast.error('Número máximo de tentativas excedido. Por favor, aguarde 5 minutos antes de tentar novamente.', {
            position: "top-right",
            autoClose: 5000,
            toastId: `maxTentativas-${Date.now()}`
          })
        } else {
          toast.error(`Domínio ${dominio} não autorizado. Tentativas restantes: ${3 - novasTentativas}`, {
            position: "top-right",
            autoClose: 5000,
            toastId: `dominioNaoAutorizado-${Date.now()}`
          })
        }
        setLoading(false)
        return
      }

      const response = await axios.post(
        'https://integrador.in.saltsystems.com.br/webhook/kaua/validar-email-senha',
        { email: formData.email,
          senha: formData.senha
        }
      )

      console.log('Resposta da validação de email:', response.data)

      if (response.data.valid) {
        setIsEmailValid(true)
        setCliente(clienteData.cliente)
        setTentativasValidacao(0)
        setEmailBloqueado(false)
        
        if (clienteData.autorizadores) {
          setAutorizadores(clienteData.autorizadores.split(',').map(auth => auth.trim()))
          console.log('Autorizadores:', clienteData.autorizadores)
          console.log('Autorizadores:', clienteData.autorizadores.split(','))
        } else {
          setAutorizadores([])
        }
        
        if (clienteData.projetos) {
          const projetosDisponiveis = clienteData.projetos.split(',').map(projeto => ({
            Nome: projeto.trim(),
            nomeInterno: projeto.trim()
          }))
          console.log('Projetos disponíveis:', projetosDisponiveis)
          setProjects(projetosDisponiveis)
        } else {
          setProjects([])
          toast.warning('Este cliente não possui projetos configurados.', {
            position: "top-right",
            autoClose: 5000,
            toastId: `semProjetos-${Date.now()}`
          })
        }
        
        toast.success('E-mail validado com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          toastId: `emailValidado-${Date.now()}`
        })
      } else {
        const novasTentativas = tentativasValidacao + 1
        setTentativasValidacao(novasTentativas)
        
        if (novasTentativas >= 3) {
          setEmailBloqueado(true)
          iniciarTemporizador()
          toast.error('Número máximo de tentativas excedido. Por favor, aguarde 5 minutos antes de tentar novamente.', {
            position: "top-right",
            autoClose: 5000,
            toastId: `maxTentativas-${Date.now()}`
          })
        } else {
          toast.error(`E-mail inválido. Tentativas restantes: ${3 - novasTentativas}`, {
            position: "top-right",
            autoClose: 5000,
            toastId: `emailInvalido-${Date.now()}`
          })
        }
        setIsEmailValid(false)
        setProjects([])
        setAutorizadores([])
      }
    } catch (error) {
      console.error('Erro ao validar e-mail:', error)
      toast.error('Não foi possível validar o e-mail.', {
        position: "top-right",
        autoClose: 5000,
        toastId: 'erroValidacao'
      })
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
        'https://integrador.in.saltsystems.com.br/webhook/kaua/abrir-chamado',
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
      setFormData({
        ...formData,
        descricao: '',
        projeto: '',
        autorizador: ''
      })
    } catch (err) {
      console.error('Erro ao enviar chamado:', err)
      toast.error('Erro ao criar o chamado. Por favor, tente novamente.', {
        position: "top-right",
        autoClose: 5000
      })
    } finally {
      setLoading(false)
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
              <S.Label htmlFor="email">Senha do cliente</S.Label>
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
 