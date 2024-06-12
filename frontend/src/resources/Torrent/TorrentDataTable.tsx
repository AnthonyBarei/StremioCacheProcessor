import { DataGrid, GridColDef, GridRowSelectionModel, GridRowId } from '@mui/x-data-grid';
import { RowFile } from '../../../../interfaces';

export default function TorrentDataTable({columns, rows, handle}: {columns: GridColDef[], rows: RowFile[], handle: (selectedRows: GridRowId[]) => void}) {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleSelectionChange = (rowSelectionModel: GridRowSelectionModel) => {
        handle(rowSelectionModel);
    };

    return (
        <div style={{ height: 400, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 5 },
                    },
                }}
                pageSizeOptions={[5, 10]}
                checkboxSelection
                autosizeOnMount={true}
                onRowSelectionModelChange={handleSelectionChange}
            />
        </div>
    );
}