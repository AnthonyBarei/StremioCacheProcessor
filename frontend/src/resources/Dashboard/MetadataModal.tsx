import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { Typography } from '@mui/material';
import { FolderProcess } from '../../../../interfaces';
import CopyToClipboardButton from '../Layouts/CopyToClipBoardButton';

const formatJson = (json: string) => {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match: string) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
};

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 1000,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto',
};

export default function MetadataModal({open, setOpen, metadata}: {open: boolean, setOpen: React.Dispatch<React.SetStateAction<boolean>>, metadata: FolderProcess}) {
    const handleClose = () => setOpen(false);
    const [jsonString, setJsonString] = React.useState<string>('');

    React.useEffect(() => {
        setJsonString(JSON.stringify(metadata, null, 2));
    }, [metadata]);

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>{metadata.id}</Typography>

                <Box component="pre" sx={{ position: 'relative', overflow: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '500px' }}>
                    <Box sx={{ position: 'absolute', top: 0, right: 5}}>
                        <CopyToClipboardButton textToCopy={jsonString}/>
                    </Box>
                    <Typography component="div" dangerouslySetInnerHTML={{ __html: formatJson(jsonString) }} />
                </Box>
            </Box>
        </Modal>
    );
}