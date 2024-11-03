import { useState, useEffect } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { styled } from "@mui/system";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const StyledIconButton = styled(IconButton)({
    '&:focus': {
        outline: 'none',
    },
});
interface CopyToClipboardButtonProps {
  textToCopy: string;
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);
  let timeoutId: NodeJS.Timeout | null = null;

  const handleClick = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    timeoutId = setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <Tooltip title="Copy to clipboard">
      <StyledIconButton onClick={handleClick} color="primary" size="small">
        {copied ? <CheckCircleIcon fontSize="inherit"/> : <ContentCopyIcon fontSize="inherit"/>}
      </StyledIconButton>
    </Tooltip>
  );
};

export default CopyToClipboardButton;