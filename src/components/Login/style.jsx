import styled from 'styled-components'

export const FormContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background-color: #999999;
`

export const StyledCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
`

export const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 24px;
`

export const Logo = styled.img`
  max-width: 300px;
  height: auto;
`

export const FormTitle = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 500;
`

export const FormGroup = styled.div`
  margin-bottom: 20px;
`

export const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
`

export const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #e1e1e1;
  border-radius: 4px;
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  &[type="password"] {
    letter-spacing: 2px;
  }
`

export const Button = styled.button`
  background-color: #685ca6;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    background-color: #cd35c0;
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`

export const TempoRestante = styled.div`
  margin-top: 8px;
  color: #dc3545;
  font-size: 14px;
  font-weight: 500;
`

export const RecaptchaContainer = styled.div`
  margin: 20px 0;
  display: flex;
  justify-content: center;
  align-items: center;
` 