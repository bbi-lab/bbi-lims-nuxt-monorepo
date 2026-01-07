export const useCrudTable = () => {
    const state = reactive({
        editingRecordId: null as string | null,
        editingRecord: null as any,
        editingMultipleRecordsIds: [] as string[],
        editingMultipleRecords: [] as any[],
        showEditForm: false,
        showAddForm: false,
        showMultipleEditForm: false,
    })
    const tableRef = ref()

    const setTableRef = (el: any) => {
        tableRef.value = el
    }

    const didClickRecordEdit = (event: any) => {
        state.editingRecordId = event.id
        state.editingRecord = event
        state.editingMultipleRecordsIds = []
        state.editingMultipleRecords = []
        state.showEditForm = true
        state.showAddForm = false
    }

    const didClickRecordAdd = () => {
        state.showAddForm = true
        state.showEditForm = false
    }
    const didClickCancelAddForm = () => {
        state.showAddForm = false
    }
    const didClickCancelEditForm = () => {
        state.editingRecordId = null
        state.showEditForm = false
    }

    const didAddRecord = (event: any) => {
        tableRef.value.addOrRefreshRecordIds([event.id])
        state.showAddForm = false
    }
    const didUpdateRecord = (event: any) => {
        tableRef.value.addOrRefreshRecordIds([event.id])
        state.showEditForm = false
    }
    const didDeleteRecord = (event: any) => {
        tableRef.value.removeRecordId(event.id)
        state.showEditForm = false
    }
    const didClickMultipleRecordEdit = (records: any[]) => {
        state.editingMultipleRecordsIds = records.map((record: any) => record.id)
        state.editingMultipleRecords = records
        state.editingRecordId = null
        state.editingRecord = null
        state.showMultipleEditForm = true
        state.showEditForm = false
        state.showAddForm = false
    }
    const didClickCancelMultipleEditForm = () => {
        state.editingMultipleRecordsIds = []
        state.showMultipleEditForm = false
    }
    const didUpdateMultipleRecords = (event: any) => {
        tableRef.value.addOrRefreshRecordIds(event.map((event: any) => event.id))
        state.showMultipleEditForm = false
    }

    return {
        state,
        tableRef,
        setTableRef,
        didClickRecordEdit,
        didClickRecordAdd,
        didClickCancelAddForm,
        didClickCancelEditForm,
        didAddRecord,
        didUpdateRecord,
        didDeleteRecord,
        didClickMultipleRecordEdit,
        didClickCancelMultipleEditForm,
        didUpdateMultipleRecords,
    }
}
