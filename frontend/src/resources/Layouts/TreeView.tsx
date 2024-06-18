import Box from '@mui/material/Box';
import { SimpleTreeView, TreeItem  } from '@mui/x-tree-view';
import { Folder } from '../../../../interfaces';

export default function TreeView({folders, rootPath, setPath}: {folders: Folder[], rootPath: string, setPath: React.Dispatch<React.SetStateAction<string>>}) {
const renderTree = (nodes: Folder | Folder[], path = ''): JSX.Element => {
    return (
        Array.isArray(nodes) 
            ? (
                <>
                    {nodes.map((node) => renderTree(node, node.name))} 
                </>
            ) 
            : (
                <TreeItem 
                    itemId={`${path}`} 
                    label={nodes.name} 
                    key={`${path}`} 
                    onClick={() => { 
                        setPath(`${rootPath}/${path}`) 
                    }}
                >
                    {Array.isArray(nodes.subfolders) ? nodes.subfolders.map((node) => renderTree(node, `${path}/${node.name}`)) : null}
                </TreeItem>
            )
    );
};

  return (
    <Box sx={{ minHeight: 352, minWidth: 250 }}>
      <SimpleTreeView>
        {renderTree(folders)}
      </SimpleTreeView>
    </Box>
  );
}
