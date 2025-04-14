import styled from 'styled-components'

export const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`

export const Logo = styled.img`
  height: 50px;
`

export const Title = styled.h1`
  color: #333;
  margin: 0;
`

export const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
`

export const Button = styled.button`
  background-color: #685ca6;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #cd35c0;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
`

export const Th = styled.th`
  background: #685ca6;
  color: white;
  padding: 1rem;
  text-align: left;
`

export const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #eee;
`

export const Tr = styled.tr`
  &:hover {
    background: #f5f5f5;
  }
`

export const Status = styled.span`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  background: ${props => {
    switch (props.status?.toLowerCase()) {
      case 'pendente-salt':
        return '#fff3e0'
      case 'em andamento':
        return '#e3f2fd'
      case 'concluído':
        return '#e8f5e9'
      default:
        return '#f5f5f5'
    }
  }};
  color: ${props => {
    switch (props.status?.toLowerCase()) {
      case 'pendente-salt':
        return '#f57c00'
      case 'em andamento':
        return '#1976d2'
      case 'concluído':
        return '#388e3c'
      default:
        return '#666666'
    }
  }};
`

export const Priority = styled.span`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  background: ${props => {
    switch (props.priority) {
      case '1':
        return '#ffebee'
      case '2':
        return '#fff3e0'
      case '3':
        return '#e8f5e9'
      default:
        return '#f5f5f5'
    }
  }};
  color: ${props => {
    switch (props.priority) {
      case '1':
        return '#d32f2f'
      case '2':
        return '#f57c00'
      case '3':
        return '#388e3c'
      default:
        return '#666666'
    }
  }};
`

export const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`

export const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #d32f2f;
`