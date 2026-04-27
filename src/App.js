import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './componentes/Navbar';
import Menu from './componentes/Menu';
import Inventario from './componentes/Inventario';
import Proveedores from './componentes/Proveedores';
import Ventas from './componentes/Ventas';
import Clientes from './componentes/Clientes';
import Mesas from './componentes/Mesas';
import Informes from './componentes/Informes';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route 
          path="/*" 
          element={
            <>
              <Navbar />
              <Routes>
                <Route path="inventario" element={<Inventario />} />
                <Route path="proveedores" element={<Proveedores />} />
                <Route path="ventas" element={<Ventas />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="mesas" element={<Mesas />} />
                <Route path="informes" element={<Informes />} />
              </Routes>
            </>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;