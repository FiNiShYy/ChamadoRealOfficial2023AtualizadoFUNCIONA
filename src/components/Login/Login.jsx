import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import ReCAPTCHA from "react-google-recaptcha"
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import logoSalt from '../../assets/logo_salt.png'
import * as S from './style'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [loading, setLoading] = useState(false)
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
  const [tentativasValidacao, setTentativasValidacao] = useState(() => {
    const saved = localStorage.getItem('tentativasValidacao')
    return saved ? parseInt(saved) : 0
  })
  const [recaptchaValue, setRecaptchaValue] = useState(null)

  const timerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
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
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
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

  const formatarTempo = (segundos) => {
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return `${minutos}:${segs.toString().padStart(2, '0')}`
  }

  const handleRecaptchaChange = (value) => {
    setRecaptchaValue(value)
  }

  const handleLogin = async (e) => {
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

      // Verifica se a resposta é vazia ou não tem a propriedade valid
      if (!validationResponse.data || validationResponse.data.length === 0) {
        throw new Error('Resposta inválida do servidor')
      }

      // Se a resposta for um array vazio ou não tiver registros, considera como inválido
      if (Array.isArray(validationResponse.data) && validationResponse.data.length === 0) {
        throw new Error('Credenciais inválidas')
      }

      // Verifica se as credenciais são válidas
      const isValid = Array.isArray(validationResponse.data) 
        ? validationResponse.data.length > 0 
        : validationResponse.data.valid

      if (!isValid) {
        const novasTentativas = tentativasValidacao + 1
        setTentativasValidacao(novasTentativas)
        
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
        setLoading(false)
        return
      }

      // Se chegou aqui, a autenticação foi bem-sucedida
      const token = validationResponse.data.token || 'dummy-token-' + Date.now()
      localStorage.setItem('authToken', token)
      localStorage.setItem('userEmail', formData.email)
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      toast.success('Login realizado com sucesso!', {
        position: "top-right",
        autoClose: 3000,
        toastId: 'loginSucesso'
      })

      navigate('/chamados')
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
      } else {
        mensagemErro = error.message || mensagemErro
      }
      
      toast.error(mensagemErro, {
        position: "top-right",
        autoClose: 5000,
        toastId: 'erroValidacao'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <S.FormContainer>
      <S.StyledCard>
        <S.LogoContainer>
          <S.Logo src={logoSalt} alt="Salt Systems" />
        </S.LogoContainer>

        <S.FormTitle>Login</S.FormTitle>

        <form onSubmit={handleLogin}>
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
            {loading ? 'Validando...' : emailBloqueado ? 'Bloqueado' : 'Entrar'}
          </S.Button>
        </form>
      </S.StyledCard>
    </S.FormContainer>
  )
}

export default Login 