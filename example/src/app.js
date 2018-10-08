import React from 'react'

export default class Home extends React.Component {
  componentDidMount () {
    this.loadSuppliers()
  }

  loadSuppliers () {
    this.props.services.suppliers.find()
      .then(result => console.log('Found ' + result.value.length + ' results'))
      .catch(err => console.error('Error while fetching data.', err))
  }

  render () {
    const suppliers = this.props.suppliers

    return (
      <div>
        <h1>Suppliers</h1>
        <button onClick={() => this.loadSuppliers()}>Refresh</button>

        <table style={{width: '100%', textAlign: 'left'}}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.keys.map((id, i) => (
              <tr key={i}>
                <td>{id}</td>
                <td>{suppliers.store[id].name}</td>
                <td>{suppliers.store[id].location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
}
