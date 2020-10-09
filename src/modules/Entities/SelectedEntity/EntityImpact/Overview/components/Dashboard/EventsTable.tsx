import * as React from 'react'
import { useTable } from 'react-table'
import { useWindowSize } from 'common/hooks'
import {useTransition} from 'react-spring'
import moment from 'moment'

import {
  TableContainer,
  StyledTableHeader,
  StyledTableCell,
  StyledTableRow,
  DateContainer,
  StyledMobileRow,
  StyledMobileBuyCell,
  StyledDateWrapper,
  StyledAmountWrapper,
} from './EventsTable.styles'
import ValueComponent from './Value'

const data = [
  {
    date: '2020-10-09',
    type: 'Bank Deposit',
    purpose: 'Disbursement',
    description: 'UBSOF:Payment for Services: Evaluation',
    value: 1500,
    status: 1,
  },
  {
    date: '2020-10-09',
    type: 'Bank Deposit',
    purpose: 'Disbursement',
    description: 'UBSOF:Payment for Services: Evaluation',
    value: 1500,
    status: 2,
  },
  {
    date: '2020-10-09',
    type: 'Bank Deposit',
    purpose: 'Disbursement',
    description: 'UBSOF:Payment for Services: Evaluation',
    value: 1500,
    status: 3,
  },
  {
    date: '2020-10-09',
    type: 'Bank Deposit',
    purpose: 'Disbursement',
    description: 'UBSOF:Payment for Services: Evaluation',
    value: 1500,
    status: 2,
  },
  {
    date: '2020-10-09',
    type: 'Bank Deposit',
    purpose: 'Disbursement',
    description: 'UBSOF:Payment for Services: Evaluation',
    value: 1500,
    status: 1,
  },
  {
    date: '2020-10-09',
    type: 'Bank Deposit',
    purpose: 'Disbursement',
    description: 'UBSOF:Payment for Services: Evaluation',
    value: 1500,
    status: 3,
  }
]

const renderCell = (cell: any): any => {
  if (cell.column.id === 'date') {
    return (
      <DateContainer>
        <span>{moment(cell.value).fromNow().slice(0, moment(cell.value).fromNow().length - 3 )}</span>&nbsp;<span> ago</span>
      </DateContainer>
    )
  } else if (cell.column.id === 'value') {
    return <ValueComponent value={cell.value} />
  } else {
    return cell.render('Cell')
  }
}

const renderDesktopTableRow = (row, props): any => {
  let className = ''
  switch (row.original.status) {
    case 1:
      className = 'done';
      break;
    case 2:
      className = 'pending';
      break;
    default:
      className = 'warning';
  }
  return(
  <StyledTableRow
    {...row.getRowProps()}
    style={props}
    className={ className }
  >
    {row.cells.map((cell) => {
      return (
        // eslint-disable-next-line react/jsx-key
        <StyledTableCell
          {...cell.getCellProps()}
          header={cell.column.id}
          type={cell.value}
        >
          {renderCell(cell)}
        </StyledTableCell>
      )
    })}
  </StyledTableRow>
)}

const renderMobileTableRow = (row): any => {
  return (
    <StyledMobileRow
      {...row.getRowProps()}
      height="70px"
    >
      <StyledMobileBuyCell
        header={row.cells[1].column.id}
        type={row.cells[1].value}
      >
        {renderCell(row.cells[1])}
      </StyledMobileBuyCell>
      <div className="d-flex text-white">
        <StyledAmountWrapper>
          <span className="mr-5">{renderCell(row.cells[2])}</span>
          <span>Quantity</span>
        </StyledAmountWrapper>
        <StyledAmountWrapper>
          <span>{renderCell(row.cells[3])}</span>
          <span>Price</span>
        </StyledAmountWrapper>
      </div>
      <StyledDateWrapper>
        <span>{renderCell(row.cells[0])}</span>
        <span>{renderCell(row.cells[4])}</span>
      </StyledDateWrapper>
    </StyledMobileRow>
  )
}

const EventsTable:React.FunctionComponent = () => {
  const columns = React.useMemo(
    () => [
      {
        Header: 'DATE',
        accessor: 'date',
      },
      {
        Header: 'TYPE',
        accessor: 'type',
      },
      {
        Header: 'PURPOSE',
        accessor: 'purpose',
      },
      {
        Header: 'DESCRIPTION',
        accessor: 'description',
      },
      {
        Header: 'VALUE',
        accessor: 'value',
      },
    ],
    [],
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data,
  })
  const size = useWindowSize()
  const updatedRows = rows.map(function (val, key) {
    val.key = `table-row-${key}`
    return val
  })
  // const initialState = [...rows]
  // const [collapsibleRow, setCollapsibleRow] = useState([])
  const transitions = useTransition(updatedRows, item => item.key, {
    from: { transform: 'translate3d(-400px,0,0)' },
    enter: { transform: 'translate3d(0,0,0)' },
    // leave: { transform: 'translate3d(0,0,0)' },
    config: { duration: 2000 }
  })
  return (
    <TableContainer>
    <table {...getTableProps()}>
      {size.width > 1024 && (
        <thead>
          {headerGroups.map((headerGroup, groupIndex) => (
            <tr key={groupIndex} {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                // eslint-disable-next-line react/jsx-key
                <StyledTableHeader {...column.getHeaderProps()}>
                  {column.render('Header')}
                </StyledTableHeader>
              ))}
            </tr>
          ))}
        </thead>
      )}
      <tbody {...getTableBodyProps()}>
        {transitions.map(({item, key, props}) => {
            prepareRow(item)
            return (
              <React.Fragment key={`table-body-${key}`}>
                {size.width > 1024 && renderDesktopTableRow(item, props)}
                {size.width <= 1024 && renderMobileTableRow(item)}
              </React.Fragment>
            )
        })}
      </tbody>
    </table>
    </TableContainer>
  )
}

export default EventsTable;