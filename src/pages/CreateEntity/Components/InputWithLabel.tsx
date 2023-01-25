import { Typography } from 'components/Typography'
import React, { ChangeEvent, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

const InputLabel = styled.label<{ filled?: boolean }>`
  position: absolute;
  left: ${(props): string => (props.filled ? '7px' : '10px')};
  transform: translateY(-50%);
  top: ${(props): string => (props.filled ? '0' : '50%')};
  pointer-events: none;
  transition: all 0.2s;
  background: inherit;

  margin: 0;
  padding: ${(props): string => (props.filled ? '0 3px' : '0')};
  line-height: 100%;
`

const ErrorLabel = styled.label`
  position: absolute;
  left: 10px;
  transform: translateY(-50%);
  bottom: -26px;
  pointer-events: none;
  transition: all 0.2s;

  font-family: ${(props): string => props.theme.primaryFontFamily};
  font-weight: 300;
  line-height: 100%;
  font-size: 10px;
  color: ${(props): string => props.theme.ixoRed};
`

const StyledInput = styled.input`
  width: 100%;
  height: 100%;
  padding: 6px 10px;
  font-family: ${(props): string => props.theme.primaryFontFamily};
  font-weight: 700;
  line-height: 28px;
  font-size: 20px;
  color: ${(props): string => props.theme.ixoBlack};
  background: transparent;
  border: none;
  outline: none;
  transition: all 0.2s;

  &:focus {
    outline: none;
  }
`

const InputWrapper = styled.div<{
  width: string
  height: string
  error: boolean
  disabled: boolean
}>`
  position: relative;
  border-radius: 8px;
  background: white;
  border: 1px solid ${(props): string => (props.error ? props.theme.ixoRed : props.theme.ixoNewBlue)};
  width: ${(props): string => props.width};
  height: ${(props): string => props.height};
  transition: all 0.2s;

  ${InputLabel}, ${StyledInput} {
    ${(props): string => (props.error && `color: ${props.theme.ixoRed};`) || ''}
  }

  ${(props): string =>
    (props.disabled &&
      `
      border-color: ${props.theme.ixoLightGrey2};
      pointer-events: none;
      ${InputLabel} {
        color: ${props.theme.ixoLightGrey2};
      }
    `) ||
    ''}
`

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  inputValue: any
  label?: string
  width?: string
  height?: string
  error?: string
  disabled?: boolean
  handleChange?: (value: any) => void
}

const InputWithLabel: React.FC<Props> = ({
  inputValue,
  label = '',
  disabled = false,
  error,
  width = '100%',
  height = 'auto',
  handleChange,
  ...rest
}): JSX.Element => {
  const inputRef = useRef(undefined)
  const [focused, setFocused] = useState(false)
  const filled = useMemo(() => focused || !!inputValue, [focused, inputValue])

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newValue = event.target.value
    handleChange && handleChange(newValue)
  }

  return (
    <InputWrapper width={width} height={height} error={!!error} disabled={disabled}>
      <InputLabel filled={filled}>
        <Typography
          weight={filled ? 'bold' : 'medium'}
          size={filled ? 'sm' : 'xl'}
          color={filled ? 'blue' : 'gray-medium'}
        >
          {label}
        </Typography>
      </InputLabel>
      <StyledInput
        ref={inputRef as any}
        value={inputValue ?? ''}
        onChange={onChange}
        onFocus={(): void => setFocused(true)}
        onBlur={(): void => setFocused(false)}
        {...rest}
      />
      <ErrorLabel>{error}</ErrorLabel>
    </InputWrapper>
  )
}

export default InputWithLabel
