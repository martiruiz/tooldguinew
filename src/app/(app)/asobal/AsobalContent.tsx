'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ExternalLink, Plus, Trash2, Star, ChevronDown, ChevronRight, Link2, Trophy, Pencil } from 'lucide-react'

const TEAMS: Record<string, string> = {
  LOG: 'Logroño', BAR: 'Barça', GRA: 'Granollers', CAN: 'Morrazo',
  BID: 'Bidasoa', NAV: 'BM Nava', ALI: 'Alicante', TLV: 'Torrelavega',
  VDA: 'Villa de Aranda', CAS: 'Ciudad Real', CQN: 'Cuenca', ATV: 'At. Valladolid',
  SEV: 'Sevilla', PGE: 'Puente Genil', PSG: 'Puerto Sagunto', ADE: 'Ademar León',
}

const PLAYERS: Record<string, { num: string; name: string; pos: string }[]> = {
  GRA: [
    { num: '12', name: 'LLUC BORRELL', pos: 'PO' }, { num: '51', name: 'PAU PANITTI', pos: 'PO' },
    { num: '6', name: 'JORDI DEUMAL', pos: 'EI' }, { num: '32', name: 'PABLO GUIJARRO', pos: 'EI' },
    { num: '29', name: 'GUILLERMO FISCHER', pos: 'LI' }, { num: '44', name: 'JUAN PALOMINO', pos: 'LI' },
    { num: '14', name: 'BRUNO REGUART', pos: 'CE' }, { num: '21', name: 'GERARD DOMINGO', pos: 'CE' },
    { num: '33', name: 'FERRAN CASTILLO', pos: 'CE' }, { num: '11', name: 'MARCOS FIS', pos: 'LD' },
    { num: '77', name: 'PABLO URDANGARIN', pos: 'LD' }, { num: '7', name: 'BERNAT POVILL', pos: 'ED' },
    { num: '9', name: 'POL CHAVES', pos: 'ED' }, { num: '13', name: 'ADRIA FIGUERAS', pos: 'PI' },
    { num: '18', name: 'JEPI ARMENGOL', pos: 'PI' }, { num: '57', name: 'RENAN IZIQUIEL PINHEIRO DA SILVA', pos: 'PI' },
  ],
  PSG: [
    { num: '1', name: 'JUANI VILLARREAL', pos: 'PO' }, { num: '16', name: 'DANI MARTINEZ', pos: 'PO' },
    { num: '2', name: 'CARLOS MARTÍN DE BOLAÑOS RUIZ', pos: 'EI' }, { num: '10', name: 'DIEGO OLBA', pos: 'EI' },
    { num: '62', name: 'JAVIER MANZANO', pos: 'EI' }, { num: '21', name: 'ARNAU FERNANDEZ PLANA', pos: 'LI' },
    { num: '34', name: 'MATHEUS DE NOVAIS', pos: 'LI' }, { num: '56', name: 'ANTONIO CAPITAN', pos: 'LI' },
    { num: '8', name: 'JAVIER OLIVARES', pos: 'CE' }, { num: '52', name: 'ALBERTO SERRADILLA', pos: 'CE' },
    { num: '11', name: 'GABRIEL NAVARRO', pos: 'LD' }, { num: '77', name: 'NICOLAS ZUNGRI', pos: 'LD' },
    { num: '15', name: 'JAKOB PELKO', pos: 'ED' }, { num: '29', name: 'GONZALO PEREZ', pos: 'ED' },
    { num: '17', name: 'ALEX POZZER', pos: 'PI' }, { num: '23', name: 'MIGUEL LLORENS', pos: 'PI' },
    { num: '33', name: 'GUILLE SOLER', pos: 'PI' }, { num: '68', name: 'JORGE ROMANILLOS', pos: 'PI' },
  ],
  SEV: [
    { num: '1', name: 'MANU GONZALEZ', pos: 'PO' }, { num: '23', name: 'KILIAN RAMIREZ', pos: 'PO' },
    { num: '62', name: 'LEO TERCARIOL', pos: 'PO' }, { num: '5', name: 'PAU LOPEZ MATEO', pos: 'EI' },
    { num: '24', name: 'DAVID MARTÍNEZ', pos: 'EI' }, { num: '97', name: 'FRAN VIZCAINO', pos: 'EI' },
    { num: '6', name: 'TITO DIAZ', pos: 'LI' }, { num: '8', name: 'CHEMA MARQUEZ', pos: 'LI' },
    { num: '29', name: 'PABLO SANCHEZ', pos: 'LI' }, { num: '88', name: 'TARCISIO FREITAS', pos: 'LI' },
    { num: '3', name: 'ALBERTO RUIZ', pos: 'CE' }, { num: '19', name: 'SASHA TIOUMENTSEV', pos: 'CE' },
    { num: '4', name: 'GERARD ROMÁN DE MINGO', pos: 'LD' }, { num: '17', name: 'RODRIGO SALINAS', pos: 'LD' },
    { num: '10', name: 'RAUL MORALES', pos: 'ED' }, { num: '91', name: 'ALFONSO RODRIGUEZ', pos: 'ED' },
    { num: '13', name: 'CARLOS CONCHILLO', pos: 'PI' }, { num: '22', name: 'ROLANDO URIOS JR', pos: 'PI' },
    { num: '33', name: 'VICTOR DECO', pos: 'PI' },
  ],
  NAV: [
    { num: '30', name: 'DZMITRY PATOTSKI', pos: 'PO' }, { num: '97', name: 'MATEUS MARTINS BUDA', pos: 'PO' },
    { num: '21', name: 'ALEX UGALDE', pos: 'EI' }, { num: '24', name: 'OSCAR MARUGÁN', pos: 'EI' },
    { num: '4', name: 'BRAIS GONZÁLEZ', pos: 'LI' }, { num: '8', name: 'ALFREDO OTERO', pos: 'LI' },
    { num: '11', name: 'MAIKO VAZQUEZ', pos: 'LI' }, { num: '36', name: 'CLÉMENT ESPARON', pos: 'LI' },
    { num: '32', name: 'JAVIER CARRIÓN', pos: 'CE' }, { num: '44', name: 'HUGO LIMA', pos: 'CE' },
    { num: '9', name: 'BAPTISTE AUDIFFRED', pos: 'LD' }, { num: '10', name: 'DAVID FERNÁNDEZ', pos: 'LD' },
    { num: '55', name: 'DAVID ROCA', pos: 'LD' }, { num: '13', name: 'FRANCISCO AHUMADA', pos: 'ED' },
    { num: '23', name: 'MARCOS ANTONIO DA SILVA', pos: 'ED' }, { num: '93', name: 'TAHU LUFUANITU', pos: 'ED' },
    { num: '25', name: 'JOSU ARZOZ', pos: 'PI' }, { num: '53', name: 'PAULO MORENO', pos: 'PI' },
    { num: '99', name: 'PABLO HERRANZ', pos: 'PI' },
  ],
  PGE: [
    { num: '1', name: 'MATEJ ASANIN', pos: 'PO' }, { num: '12', name: 'ALVARO DE HITA', pos: 'PO' },
    { num: '5', name: 'ANTONIO CABELLO', pos: 'EI' }, { num: '11', name: 'PABLO SOLER', pos: 'EI' },
    { num: '34', name: 'MARIO DORADO', pos: 'EI' }, { num: '19', name: 'NICOLAS BONANNO', pos: 'LI' },
    { num: '23', name: 'DANIEL SERRANO', pos: 'LI' }, { num: '78', name: 'DAVID ESTEPA', pos: 'LI' },
    { num: '4', name: 'PABLO SIMONET', pos: 'CE' }, { num: '24', name: 'YOUSSEF AHMED LAOLOUA', pos: 'CE' },
    { num: '26', name: 'QUIM ROCAS', pos: 'CE' }, { num: '18', name: 'DANIEL VIEIRA', pos: 'LD' },
    { num: '', name: 'PACO ANDRÉS', pos: 'ED' }, { num: '7', name: 'RAÚL CARO', pos: 'ED' },
    { num: '8', name: 'PACO BERNABEU', pos: 'ED' }, { num: '6', name: 'DANI RAMOS', pos: 'PI' },
    { num: '21', name: 'TIAGO SOUSA', pos: 'PI' },
  ],
  CAN: [
    { num: '1', name: 'IVAN PANJAN', pos: 'PO' }, { num: '16', name: 'MATEO PALLAS', pos: 'PO' },
    { num: '19', name: 'ARNAU FERNÁNDEZ', pos: 'EI' }, { num: '23', name: 'MARTÍN FUENTES POMBO', pos: 'EI' },
    { num: '11', name: 'SAMUEL PEREIRO', pos: 'LI' }, { num: '26', name: 'NEMANJA PESTIC', pos: 'LI' },
    { num: '28', name: 'MARCELL CSABA LUDMAN', pos: 'LI' }, { num: '17', name: 'MANU PÉREZ', pos: 'CE' },
    { num: '33', name: 'PELLE BOESEN', pos: 'CE' }, { num: '44', name: 'SANTI LOPEZ', pos: 'CE' },
    { num: '14', name: 'MARTÍN GAYO', pos: 'LD' }, { num: '55', name: 'ANGEL RIVERO', pos: 'LD' },
    { num: '9', name: 'TOLLEF OSKAR LINDQVIST', pos: 'ED' }, { num: '22', name: 'HUGO VILA', pos: 'ED' },
    { num: '10', name: 'JUAN CARLOS QUINTAS', pos: 'PI' }, { num: '29', name: 'JAVI GARCÍA LOPEZ', pos: 'PI' },
    { num: '35', name: 'PABLO CASTRO', pos: 'PI' },
  ],
  CQN: [
    { num: '12', name: 'PEDRO TONICHER', pos: 'PO' }, { num: '74', name: 'GABOR DECSI', pos: 'PO' },
    { num: '92', name: 'DANIEL ARGUILLAS', pos: 'PO' }, { num: '7', name: 'IGNACIO PIZARRO', pos: 'EI' },
    { num: '15', name: 'SERGIO ANTUNEZ', pos: 'EI' }, { num: '3', name: 'SANTI BARCELO', pos: 'LI' },
    { num: '5', name: 'VINICIUS BERTOLDO', pos: 'LI' }, { num: '31', name: 'JOAO GUILHERME PERBELINI', pos: 'LI' },
    { num: '6', name: 'MANUEL LIMA', pos: 'CE' }, { num: '18', name: 'RAJMOND TÓTH', pos: 'CE' },
    { num: '44', name: 'JAIME COLMENA', pos: 'CE' }, { num: '30', name: 'FEDE PIZARRO', pos: 'LD' },
    { num: '96', name: 'GUILHERME TAVARES', pos: 'LD' }, { num: '17', name: 'JAN BLAS', pos: 'ED' },
    { num: '53', name: 'DAVID NOTARIO', pos: 'ED' }, { num: '77', name: 'MIGUEL PINTO', pos: 'ED' },
    { num: '4', name: 'ENRICO ALDINI', pos: 'PI' }, { num: '8', name: 'ÁLVARO MARTÍN NOEDA', pos: 'PI' },
    { num: '11', name: 'LUCAS MOSCARIELLO', pos: 'PI' }, { num: '19', name: 'PEDRO MATOS', pos: 'PI' },
  ],
  VDA: [
    { num: '12', name: 'FILIP SARIC', pos: 'PO' }, { num: '16', name: 'VASCO TEIXEIRA', pos: 'PO' },
    { num: '3', name: 'NOAH MARTINSSON', pos: 'EI' }, { num: '6', name: 'MATEO ARIAS', pos: 'EI' },
    { num: '19', name: 'VICTOR MEGIAS', pos: 'EI' }, { num: '71', name: 'MEHRAN RAHNAMA FALAVARJANI', pos: 'LI' },
    { num: '88', name: 'TAMÁS JÁNOSI', pos: 'LI' }, { num: '91', name: 'SAMUEL CORDIES', pos: 'LI' },
    { num: '9', name: 'ALBERTO G. PINILLOS', pos: 'CE' }, { num: '50', name: 'FRANCISCO PEREIRA', pos: 'CE' },
    { num: '10', name: 'ARTHUR PEREIRA', pos: 'LD' }, { num: '66', name: 'DAVID LÓPEZ', pos: 'LD' },
    { num: '78', name: 'NEMANJA JOVIC', pos: 'LD' }, { num: '17', name: 'ANDIS BORS', pos: 'ED' },
    { num: '47', name: 'JUAN TAMAYO', pos: 'ED' }, { num: '77', name: 'ALEX BERBEL', pos: 'ED' },
    { num: '22', name: 'PEDRO MARTINEZ AYRES BORBA', pos: 'PI' }, { num: '26', name: 'ROBERT ROSELL', pos: 'PI' },
    { num: '33', name: 'ARTUR PARERA', pos: 'PI' },
  ],
  ALI: [
    { num: '12', name: 'ROBERTO DOMENECH', pos: 'PO' }, { num: '14', name: 'PAU GUITART', pos: 'PO' },
    { num: '3', name: 'FÁBIO TEIXEIRA', pos: 'EI' }, { num: '5', name: 'DANIEL REINANTE', pos: 'EI' },
    { num: '15', name: 'AUGUSTO MORENO', pos: 'LI' }, { num: '18', name: 'EDU ESCOBEDO', pos: 'LI' },
    { num: '23', name: 'JAMES LEWIS PARKER', pos: 'LI' }, { num: '88', name: 'DARKO DIMITRIEVSKI', pos: 'LI' },
    { num: '10', name: 'ANDER TORRIKO', pos: 'CE' }, { num: '11', name: 'JUAN CARLOS SEMPERE', pos: 'CE' },
    { num: '24', name: 'HAMZA WALID ABDALLA', pos: 'CE' }, { num: '4', name: 'JAVIER BORRAGÁN', pos: 'LD' },
    { num: '77', name: 'AARON GUTIÉRREZ', pos: 'LD' }, { num: '97', name: 'RAFAEL VASCONCELOS', pos: 'LD' },
    { num: '17', name: 'LAUTARO ROBLEDO', pos: 'ED' }, { num: '64', name: 'ADRIAN SANCHEZ', pos: 'ED' },
    { num: '2', name: 'IVAN MONTOYA', pos: 'PI' }, { num: '8', name: 'PEPE OLIVER', pos: 'PI' },
    { num: '73', name: 'CARLES ASENSIO', pos: 'PI' },
  ],
  CAS: [
    { num: '1', name: 'SANTIAGO GIOVAGNOLA', pos: 'PO' }, { num: '12', name: 'FERNANDO ROMERO', pos: 'PO' },
    { num: '87', name: 'JUAN MANUEL BAR', pos: 'PO' }, { num: '28', name: 'SERGIO LOPEZ', pos: 'EI' },
    { num: '31', name: 'HUGO POLADURA', pos: 'EI' }, { num: '4', name: 'ADI OMERAGIC', pos: 'LI' },
    { num: '22', name: 'JAVI DOMINGO', pos: 'LI' }, { num: '88', name: 'JUAN GULL', pos: 'LI' },
    { num: '3', name: 'SERGI MACH', pos: 'CE' }, { num: '30', name: 'AITOR ALBIZU', pos: 'CE' },
    { num: '5', name: 'JORGE MAQUEDA', pos: 'LD' }, { num: '9', name: 'ALONSO MORENO', pos: 'LD' },
    { num: '34', name: 'DAVID CADARSO', pos: 'ED' }, { num: '77', name: 'SERGIO CASARES MINGO', pos: 'ED' },
    { num: '2', name: 'THORGILS SVÖLU BALDURSSON', pos: 'PI' }, { num: '7', name: 'JUAN MANUEL LUMBRERAS', pos: 'PI' },
    { num: '17', name: 'NACHO PLAZA', pos: 'PI' }, { num: '20', name: 'PEDRO SOSA DAITX', pos: 'PI' },
  ],
  ADE: [
    { num: '14', name: 'ALVARO PEREZ', pos: 'PO' }, { num: '98', name: 'MARCOS GARCÍA', pos: 'PO' },
    { num: '5', name: 'ADRIÁN CASQUEIRO', pos: 'EI' }, { num: '21', name: 'RAÚL GARCÍA LLAMAZARES', pos: 'EI' },
    { num: '2', name: 'OSCAR LINDQVIST', pos: 'LI' }, { num: '23', name: 'ÁLEX LODOS', pos: 'LI' },
    { num: '3', name: 'JAVIER MIÑAMBRES', pos: 'CE' }, { num: '31', name: 'JUAN CASTRO', pos: 'CE' },
    { num: '7', name: 'PATRYK WASIAK', pos: 'LD' }, { num: '66', name: 'EDUARDO FERNANDEZ', pos: 'LD' },
    { num: '17', name: 'ÁLVARO DUARTE ZAPICO', pos: 'ED' }, { num: '19', name: 'GONZALO PÉREZ ARCE', pos: 'ED' },
    { num: '13', name: 'RUBEN ROZADA', pos: 'PI' }, { num: '33', name: 'ALBERTO MARTÍN', pos: 'PI' },
    { num: '73', name: 'RODRIGO BENITES', pos: 'PI' },
  ],
  ATV: [
    { num: '16', name: 'CESAR PÉREZ', pos: 'PO' }, { num: '32', name: 'BENEDEK NAGY', pos: 'PO' },
    { num: '83', name: 'NICOLÁS GIRALDEZ', pos: 'PO' }, { num: '4', name: 'SERGIO SANCHEZ VIDÁN', pos: 'EI' },
    { num: '23', name: 'ALEX DÍAZ', pos: 'EI' }, { num: '22', name: 'ASIER IRIBAR', pos: 'LI' },
    { num: '25', name: 'RARES FODOREAN', pos: 'LI' }, { num: '33', name: 'PABLO HERRERO', pos: 'LI' },
    { num: '11', name: 'ALEJANDRO PISONERO', pos: 'CE' }, { num: '30', name: 'ALEX COLÓN', pos: 'CE' },
    { num: '35', name: 'IGNACIO SUAREZ', pos: 'CE' }, { num: '47', name: 'STJEPAN JOZINOVIC', pos: 'LD' },
    { num: '73', name: 'JOSE TOLEDO', pos: 'LD' }, { num: '9', name: 'TAO GEY-EMPARAN', pos: 'ED' },
    { num: '24', name: 'JORGE SERRANO', pos: 'ED' }, { num: '15', name: 'MAHMOUD ABDEL AZIZE', pos: 'PI' },
    { num: '51', name: 'LUCAS RIBEIRO', pos: 'PI' }, { num: '75', name: 'DANTE COMPANYS', pos: 'PI' },
    { num: '99', name: 'GUILHERME CARVALHO CABRAL', pos: 'PI' },
  ],
  TLV: [
    { num: '16', name: 'RANGEL LUAN', pos: 'PO' }, { num: '89', name: 'SAEID BARKHORDARI', pos: 'PO' },
    { num: '10', name: 'ALEX RUBIÑO', pos: 'EI' }, { num: '32', name: 'ANGEL FERNANDEZ', pos: 'EI' },
    { num: '15', name: 'JUANJO FERNÁNDEZ', pos: 'LI' }, { num: '18', name: 'JAKUB PROKOP', pos: 'LI' },
    { num: '27', name: 'FRANK CORDIES', pos: 'LI' }, { num: '30', name: 'PEDRO BERRIO', pos: 'LI' },
    { num: '21', name: 'ISIDORO MARTINEZ', pos: 'CE' }, { num: '26', name: 'MARKO JURKOVIC', pos: 'CE' },
    { num: '77', name: 'NICOLAI COLUNGA', pos: 'CE' }, { num: '3', name: 'ANDRÉS MOYANO', pos: 'LD' },
    { num: '19', name: 'MIKAEL LOPES CANDIDO', pos: 'LD' }, { num: '14', name: 'JAVI MUÑOZ', pos: 'ED' },
    { num: '25', name: 'FACUNDO CANGIANI', pos: 'ED' }, { num: '4', name: 'MARCIO DA SILVA MAILDO', pos: 'PI' },
    { num: '24', name: 'JOKIN AJA', pos: 'PI' }, { num: '88', name: 'DIEGO GANDARA', pos: 'PI' },
  ],
  BID: [
    { num: '1', name: 'DAVID FAILDE', pos: 'PO' }, { num: '33', name: 'JAKUB SKRZYNIARZ', pos: 'PO' },
    { num: '40', name: 'LEO MACIEL', pos: 'PO' }, { num: '3', name: 'XAVI TUA', pos: 'EI' },
    { num: '21', name: 'UNAI BARRETO', pos: 'EI' }, { num: '88', name: 'JOAO MAGALHAES', pos: 'EI' },
    { num: '10', name: 'ENEKO FURUNDARENA', pos: 'LI' }, { num: '22', name: 'ALEX RAIX', pos: 'LI' },
    { num: '27', name: 'MARIO NEVADO', pos: 'LI' }, { num: '37', name: 'JON ANDER IRIBAR', pos: 'LI' },
    { num: '31', name: 'GORKA NIETO', pos: 'CE' }, { num: '55', name: 'NIKO MINDEGIA', pos: 'CE' },
    { num: '19', name: 'JULEN MUJIKA', pos: 'LD' }, { num: '24', name: 'MIGUEL ÁNGEL MARTÍN DUQUE', pos: 'LD' },
    { num: '2', name: 'IÑAKI CAVERO', pos: 'ED' }, { num: '8', name: 'XAVIER GONZALEZ', pos: 'ED' },
    { num: '4', name: 'MARKO JEVTIC', pos: 'PI' }, { num: '5', name: 'IÑAKI PECIÑA', pos: 'PI' },
    { num: '11', name: 'ESTEBAN SALINAS', pos: 'PI' }, { num: '28', name: 'MATHEUS FRANCISCO DA SILVA', pos: 'PI' },
    { num: '47', name: 'JAKUB SLADKOWSKI', pos: 'PI' },
  ],
  LOG: [
    { num: '1', name: 'XOAN LEDO', pos: 'PO' }, { num: '16', name: 'MARCOS CANCIO', pos: 'PO' },
    { num: '5', name: 'FRANCISCO LOMBARDI', pos: 'EI' }, { num: '10', name: 'TOMOKI ISHIDA', pos: 'EI' },
    { num: '4', name: 'GUSTAVO OLIVEIRA', pos: 'LI' }, { num: '24', name: 'SAMUEL SAIZ', pos: 'LI' },
    { num: '7', name: 'ALVARO PRECIADO', pos: 'CE' }, { num: '9', name: 'UNAI GALÁN', pos: 'CE' },
    { num: '23', name: 'MARTÍN JUNG', pos: 'CE' }, { num: '19', name: 'MIGUEL MARTÍNEZ LOBATO', pos: 'LD' },
    { num: '48', name: 'LUKA JEVTIC', pos: 'LD' }, { num: '8', name: 'ORIOL ZARZUELA', pos: 'ED' },
    { num: '11', name: "NICOLÓ D'ANTINO", pos: 'ED' }, { num: '15', name: 'AITOR GARCÍA', pos: 'PI' },
    { num: '18', name: 'ÁLVARO MARTÍNEZ LOBATO', pos: 'PI' }, { num: '43', name: 'IVAN POPOVIC', pos: 'PI' },
  ],
  BAR: [
    { num: '1', name: 'VIKTOR GISLI HALLGRIMSSON', pos: 'PO' }, { num: '25', name: 'SERGEY HERNANDEZ', pos: 'PO' },
    { num: '6', name: 'DANI FERNÁNDEZ', pos: 'EI' }, { num: '83', name: 'IAN BARRUFET', pos: 'EI' },
    { num: '9', name: 'JONATHAN CARLSBOGARD', pos: 'LI' }, { num: '19', name: "TIMOTHEY N'GUESSAN", pos: 'LI' },
    { num: '70', name: 'ORIOL SAN FELIPE', pos: 'LI' }, { num: '3', name: 'JANUS DADI SMARASON', pos: 'CE' },
    { num: '45', name: 'SEIF ELDERAA', pos: 'CE' }, { num: '88', name: 'PETAR CIKUSA', pos: 'CE' },
    { num: '10', name: 'DIKA MEM', pos: 'LD' }, { num: '11', name: 'DJORDJE CIKUSA', pos: 'LD' },
    { num: '23', name: 'ADRIÁN SOLA', pos: 'LD' }, { num: '18', name: 'BLAZ JANC', pos: 'ED' },
    { num: '20', name: 'ALEIX GÓMEZ', pos: 'ED' }, { num: '27', name: 'OSCAR GRAU', pos: 'PI' },
    { num: '72', name: 'LUDOVIC FABREGAS', pos: 'PI' }, { num: '82', name: 'LUIS FRADE', pos: 'PI' },
  ],
}

const TEAM_LOGOS: Record<string, string> = {
  LOG: '/team-log.svg', BAR: '/team-bar.svg', GRA: '/team-gra.svg', CAN: '/team-can.svg',
  BID: '/team-bid.svg', NAV: '/team-nav.svg', ALI: '/team-ali.svg', TLV: '/team-tlv.svg',
  VDA: '/team-vda.png', CAS: '/team-cas.svg', CQN: '/team-cqn.svg', ATV: '/team-atv.svg',
  SEV: '/team-sev.svg', PGE: '/team-pge.svg', PSG: '/team-psg.svg', ADE: '/team-ade.svg',
}

function TeamLogo({ code, size = 32 }: { code: string; size?: number }) {
  const logo = TEAM_LOGOS[code]
  return logo
    ? <img src={logo} alt={TEAMS[code]} title={TEAMS[code]} style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, display: 'block' }} />
    : <span title={TEAMS[code]} style={{ width: size, height: size, borderRadius: 6, background: '#E8ECF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#9aa5b4', flexShrink: 0 }}>{code}</span>
}

function TeamName({ code, size = 20 }: { code: string; size?: number }) {
  return <TeamLogo code={code} size={size} />
}

const POS_ORDER = ['PO', 'EI', 'LI', 'CE', 'LD', 'ED', 'PI']
const POS_LABEL: Record<string, string> = { PO: 'Porters', EI: 'Extrems esq.', LI: 'Laterals esq.', CE: 'Centrals', LD: 'Laterals dret', ED: 'Extrems dret', PI: 'Pivots' }
const POS_COLOR: Record<string, string> = { PO: '#7c6fe0', EI: '#e07c6f', LI: '#6f9ee0', CE: '#1b3bda', LD: '#6fb3e0', ED: '#e09a6f', PI: '#16a34a' }

function PlayerSelect({ players, value, onChange, actionType }: {
  players: { num: string; name: string; pos: string }[];
  value: string;
  onChange: (name: string) => void;
  actionType: 'gol' | 'aturada';
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = players
    .filter(p => actionType === 'aturada' ? p.pos === 'PO' : p.pos !== 'PO')
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.num.includes(search))

  const grouped = POS_ORDER
    .filter(pos => actionType === 'aturada' ? pos === 'PO' : pos !== 'PO')
    .map(pos => ({ pos, items: filtered.filter(p => p.pos === pos) }))
    .filter(g => g.items.length > 0)

  const allFiltered = players.filter(p => actionType === 'aturada' ? p.pos === 'PO' : p.pos !== 'PO')
  const selected = allFiltered.find(p => p.name === value)

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <button
        onClick={() => { setOpen(o => !o); setSearch('') }}
        style={{ width: '100%', background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7, color: selected ? '#1a202c' : '#9aa5b4', fontFamily: 'inherit', fontSize: 12, fontWeight: selected ? 600 : 400, padding: '6px 10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
          {selected
            ? <><span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: POS_COLOR[selected.pos] || '#1b3bda', borderRadius: 3, padding: '1px 5px' }}>{selected.pos}</span><span style={{ color: '#9aa5b4', marginRight: 2 }}>#{selected.num}</span>{selected.name}</>
            : (actionType === 'aturada' ? 'Selecciona porter...' : 'Selecciona jugador...')}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}><path d="M1 1l4 4 4-4" stroke="#9aa5b4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200, background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
          {actionType === 'gol' && (
            <div style={{ padding: '7px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <input
                autoFocus
                placeholder="Cerca per nom o número..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 12, color: '#1a202c', background: 'transparent' }}
              />
            </div>
          )}
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {grouped.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 12, color: '#9aa5b4', textAlign: 'center' }}>Sense resultats</div>
            )}
            {grouped.map(g => (
              <div key={g.pos}>
                <div style={{ padding: '5px 12px 3px', fontSize: 9, fontWeight: 800, color: POS_COLOR[g.pos], letterSpacing: '.08em', textTransform: 'uppercase', background: '#fafafa', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  {POS_LABEL[g.pos]}
                </div>
                {g.items.map(p => (
                  <div
                    key={p.num + p.name}
                    onClick={() => { onChange(p.name); setOpen(false); setSearch('') }}
                    style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: value === p.name ? 'rgba(27,59,218,0.06)' : 'transparent', borderLeft: `3px solid ${value === p.name ? '#1b3bda' : 'transparent'}` }}
                    onMouseEnter={e => { if (value !== p.name) (e.currentTarget as HTMLDivElement).style.background = '#f5f7ff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = value === p.name ? 'rgba(27,59,218,0.06)' : 'transparent' }}
                  >
                    <span style={{ minWidth: 26, fontSize: 10, fontWeight: 700, color: '#fff', background: POS_COLOR[p.pos] || '#1b3bda', borderRadius: 4, padding: '2px 4px', textAlign: 'center' }}>{p.num || '—'}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1a202c' }}>{p.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MinuteSelect({ value, onChange }: { value: string; onChange: (m: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', width: 70, flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7, color: value ? '#1a202c' : '#9aa5b4', fontFamily: 'inherit', fontSize: 12, fontWeight: value ? 700 : 400, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}
      >
        <span>{value ? `${value}'` : 'Min.'}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}><path d="M1 1l4 4 4-4" stroke="#9aa5b4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 200, background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.14)', padding: '10px', width: 210 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
            {Array.from({ length: 60 }, (_, i) => i + 1).map(m => (
              <button
                key={m}
                onClick={() => { onChange(String(m)); setOpen(false) }}
                style={{ padding: '6px 0', borderRadius: 6, border: 'none', background: value === String(m) ? '#1b3bda' : m <= 30 ? 'rgba(27,59,218,0.05)' : 'rgba(245,166,35,0.08)', color: value === String(m) ? '#fff' : m <= 30 ? '#1b3bda' : '#d48a00', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .1s' }}
              >
                {m}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: 10, color: '#9aa5b4', display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(27,59,218,0.12)', display: 'inline-block' }}/> 1a part</span>
            <span style={{ fontSize: 10, color: '#9aa5b4', display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(245,166,35,0.15)', display: 'inline-block' }}/> 2a part</span>
          </div>
        </div>
      )}
    </div>
  )
}

type Match = { home: string; away: string }
type Jornada = { date: string; matches: Match[] }

const CALENDAR: Jornada[] = [
  { date: '12/09/2026', matches: [{ home:'LOG', away:'BAR' },{ home:'GRA', away:'CAN' },{ home:'BID', away:'NAV' },{ home:'ALI', away:'TLV' },{ home:'VDA', away:'CAS' },{ home:'CQN', away:'ATV' },{ home:'SEV', away:'PGE' },{ home:'PSG', away:'ADE' }]},
  { date: '19/09/2026', matches: [{ home:'TLV', away:'NAV' },{ home:'ATV', away:'VDA' },{ home:'ADE', away:'CQN' },{ home:'CAS', away:'ALI' },{ home:'CAN', away:'BID' },{ home:'PGE', away:'BAR' },{ home:'SEV', away:'LOG' },{ home:'PSG', away:'GRA' }]},
  { date: '26/09/2026', matches: [{ home:'BAR', away:'CAS' },{ home:'ATV', away:'PSG' },{ home:'ADE', away:'CAN' },{ home:'ALI', away:'GRA' },{ home:'VDA', away:'BID' },{ home:'CQN', away:'SEV' },{ home:'PGE', away:'TLV' },{ home:'NAV', away:'LOG' }]},
  { date: '03/10/2026', matches: [{ home:'LOG', away:'PSG' },{ home:'GRA', away:'CQN' },{ home:'BID', away:'PGE' },{ home:'CAS', away:'ADE' },{ home:'BAR', away:'ALI' },{ home:'TLV', away:'VDA' },{ home:'CAN', away:'ATV' },{ home:'NAV', away:'SEV' }]},
  { date: '10/10/2026', matches: [{ home:'VDA', away:'BAR' },{ home:'TLV', away:'CAN' },{ home:'ATV', away:'PGE' },{ home:'ADE', away:'NAV' },{ home:'CAS', away:'GRA' },{ home:'CQN', away:'LOG' },{ home:'BID', away:'SEV' },{ home:'PSG', away:'ALI' }]},
  { date: '17/10/2026', matches: [{ home:'ALI', away:'BID' },{ home:'ATV', away:'CAS' },{ home:'ADE', away:'VDA' },{ home:'CQN', away:'TLV' },{ home:'CAN', away:'BAR' },{ home:'PGE', away:'LOG' },{ home:'SEV', away:'GRA' },{ home:'PSG', away:'NAV' }]},
  { date: '24/10/2026', matches: [{ home:'BAR', away:'CQN' },{ home:'LOG', away:'CAN' },{ home:'GRA', away:'PGE' },{ home:'BID', away:'CAS' },{ home:'TLV', away:'SEV' },{ home:'ALI', away:'ADE' },{ home:'VDA', away:'PSG' },{ home:'NAV', away:'ATV' }]},
  { date: '31/10/2026', matches: [{ home:'GRA', away:'BAR' },{ home:'ATV', away:'TLV' },{ home:'ADE', away:'BID' },{ home:'CAS', away:'LOG' },{ home:'CAN', away:'ALI' },{ home:'PGE', away:'VDA' },{ home:'NAV', away:'CQN' },{ home:'SEV', away:'PSG' }]},
  { date: '14/11/2026', matches: [{ home:'BAR', away:'SEV' },{ home:'LOG', away:'GRA' },{ home:'TLV', away:'ADE' },{ home:'ATV', away:'ALI' },{ home:'VDA', away:'NAV' },{ home:'CQN', away:'CAS' },{ home:'PGE', away:'CAN' },{ home:'PSG', away:'BID' }]},
  { date: '21/11/2026', matches: [{ home:'LOG', away:'ADE' },{ home:'GRA', away:'ATV' },{ home:'BID', away:'BAR' },{ home:'CAS', away:'TLV' },{ home:'ALI', away:'VDA' },{ home:'PSG', away:'CQN' },{ home:'NAV', away:'PGE' },{ home:'CAN', away:'SEV' }]},
  { date: '28/11/2026', matches: [{ home:'BAR', away:'NAV' },{ home:'TLV', away:'BID' },{ home:'ATV', away:'LOG' },{ home:'ADE', away:'GRA' },{ home:'CQN', away:'VDA' },{ home:'CAN', away:'CAS' },{ home:'PGE', away:'PSG' },{ home:'SEV', away:'ALI' }]},
  { date: '05/12/2026', matches: [{ home:'BAR', away:'ATV' },{ home:'LOG', away:'BID' },{ home:'GRA', away:'NAV' },{ home:'TLV', away:'PSG' },{ home:'ADE', away:'PGE' },{ home:'CAS', away:'SEV' },{ home:'ALI', away:'CQN' },{ home:'VDA', away:'CAN' }]},
  { date: '12/12/2026', matches: [{ home:'LOG', away:'TLV' },{ home:'BID', away:'GRA' },{ home:'ATV', away:'ADE' },{ home:'CAN', away:'CQN' },{ home:'PGE', away:'ALI' },{ home:'NAV', away:'CAS' },{ home:'SEV', away:'VDA' },{ home:'PSG', away:'BAR' }]},
  { date: '19/12/2026', matches: [{ home:'BAR', away:'ADE' },{ home:'GRA', away:'TLV' },{ home:'VDA', away:'LOG' },{ home:'CQN', away:'BID' },{ home:'PGE', away:'CAS' },{ home:'NAV', away:'ALI' },{ home:'SEV', away:'ATV' },{ home:'PSG', away:'CAN' }]},
  { date: '23/12/2026', matches: [{ home:'BID', away:'ATV' },{ home:'TLV', away:'BAR' },{ home:'ADE', away:'SEV' },{ home:'CAS', away:'PSG' },{ home:'ALI', away:'LOG' },{ home:'VDA', away:'GRA' },{ home:'CQN', away:'PGE' },{ home:'CAN', away:'NAV' }]},
  { date: '13/02/2027', matches: [{ home:'BAR', away:'LOG' },{ home:'TLV', away:'ALI' },{ home:'ATV', away:'CQN' },{ home:'ADE', away:'PSG' },{ home:'CAS', away:'VDA' },{ home:'CAN', away:'GRA' },{ home:'PGE', away:'SEV' },{ home:'NAV', away:'BID' }]},
  { date: '20/02/2027', matches: [{ home:'BAR', away:'PGE' },{ home:'LOG', away:'SEV' },{ home:'GRA', away:'PSG' },{ home:'BID', away:'CAN' },{ home:'ALI', away:'CAS' },{ home:'VDA', away:'ATV' },{ home:'CQN', away:'ADE' },{ home:'NAV', away:'TLV' }]},
  { date: '27/02/2027', matches: [{ home:'LOG', away:'NAV' },{ home:'GRA', away:'ALI' },{ home:'BID', away:'VDA' },{ home:'TLV', away:'PGE' },{ home:'CAS', away:'BAR' },{ home:'CAN', away:'ADE' },{ home:'SEV', away:'CQN' },{ home:'PSG', away:'ATV' }]},
  { date: '06/03/2027', matches: [{ home:'ALI', away:'BAR' },{ home:'VDA', away:'TLV' },{ home:'ATV', away:'CAN' },{ home:'ADE', away:'CAS' },{ home:'CQN', away:'GRA' },{ home:'PGE', away:'BID' },{ home:'SEV', away:'NAV' },{ home:'PSG', away:'LOG' }]},
  { date: '20/03/2027', matches: [{ home:'LOG', away:'CQN' },{ home:'GRA', away:'CAS' },{ home:'SEV', away:'BID' },{ home:'ALI', away:'PSG' },{ home:'BAR', away:'VDA' },{ home:'CAN', away:'TLV' },{ home:'PGE', away:'ATV' },{ home:'NAV', away:'ADE' }]},
  { date: '27/03/2027', matches: [{ home:'BAR', away:'CAN' },{ home:'LOG', away:'PGE' },{ home:'GRA', away:'SEV' },{ home:'TLV', away:'CQN' },{ home:'CAS', away:'ATV' },{ home:'BID', away:'ALI' },{ home:'VDA', away:'ADE' },{ home:'NAV', away:'PSG' }]},
  { date: '03/04/2027', matches: [{ home:'ATV', away:'NAV' },{ home:'ADE', away:'ALI' },{ home:'CAS', away:'BID' },{ home:'CQN', away:'BAR' },{ home:'CAN', away:'LOG' },{ home:'PGE', away:'GRA' },{ home:'SEV', away:'TLV' },{ home:'PSG', away:'VDA' }]},
  { date: '10/04/2027', matches: [{ home:'BAR', away:'GRA' },{ home:'LOG', away:'CAS' },{ home:'BID', away:'ADE' },{ home:'TLV', away:'ATV' },{ home:'ALI', away:'CAN' },{ home:'VDA', away:'PGE' },{ home:'CQN', away:'NAV' },{ home:'PSG', away:'SEV' }]},
  { date: '17/04/2027', matches: [{ home:'GRA', away:'LOG' },{ home:'BID', away:'PSG' },{ home:'ADE', away:'TLV' },{ home:'CAS', away:'CQN' },{ home:'ALI', away:'ATV' },{ home:'CAN', away:'PGE' },{ home:'NAV', away:'VDA' },{ home:'SEV', away:'BAR' }]},
  { date: '24/04/2027', matches: [{ home:'BAR', away:'BID' },{ home:'TLV', away:'CAS' },{ home:'ATV', away:'GRA' },{ home:'ADE', away:'LOG' },{ home:'VDA', away:'ALI' },{ home:'CQN', away:'PSG' },{ home:'PGE', away:'NAV' },{ home:'SEV', away:'CAN' }]},
  { date: '01/05/2027', matches: [{ home:'LOG', away:'ATV' },{ home:'GRA', away:'ADE' },{ home:'BID', away:'TLV' },{ home:'CAS', away:'CAN' },{ home:'ALI', away:'SEV' },{ home:'VDA', away:'CQN' },{ home:'NAV', away:'BAR' },{ home:'PSG', away:'PGE' }]},
  { date: '22/05/2027', matches: [{ home:'BID', away:'LOG' },{ home:'ATV', away:'BAR' },{ home:'CQN', away:'ALI' },{ home:'CAN', away:'VDA' },{ home:'PGE', away:'ADE' },{ home:'NAV', away:'GRA' },{ home:'SEV', away:'CAS' },{ home:'PSG', away:'TLV' }]},
  { date: '29/05/2027', matches: [{ home:'BAR', away:'PSG' },{ home:'GRA', away:'BID' },{ home:'TLV', away:'LOG' },{ home:'ADE', away:'ATV' },{ home:'CAS', away:'NAV' },{ home:'ALI', away:'PGE' },{ home:'VDA', away:'SEV' },{ home:'CQN', away:'CAN' }]},
  { date: '02/06/2027', matches: [{ home:'LOG', away:'VDA' },{ home:'BID', away:'CQN' },{ home:'TLV', away:'GRA' },{ home:'ATV', away:'SEV' },{ home:'ADE', away:'BAR' },{ home:'CAS', away:'PGE' },{ home:'ALI', away:'NAV' },{ home:'CAN', away:'PSG' }]},
  { date: '05/06/2027', matches: [{ home:'BAR', away:'TLV' },{ home:'LOG', away:'ALI' },{ home:'GRA', away:'VDA' },{ home:'ATV', away:'BID' },{ home:'PGE', away:'CQN' },{ home:'NAV', away:'CAN' },{ home:'SEV', away:'ADE' },{ home:'PSG', away:'CAS' }]},
]

const LINKS = [
  { label: 'Partits Sencers', href: 'https://www.dropbox.com/scl/fo/2rgdhflbnccmfyadputfw/APyN2YgRXtiCAiWPPCmbV90?rlkey=aovfeo3ijhf66hien2bdp6ers&st=w82kqnfu&e=2&dl=0', color: '#0061FF' },
  { label: 'Resums ASOBAL', href: 'https://www.dropbox.com/scl/fo/u52uunwkuzfa1ss70f0co/AOYLjMB9CyogQ0hLVn4mal8?rlkey=fc4qc2shvvebzzh7m41x3zll4&st=1vz1t0gw&e=2&dl=0', color: '#0061FF' },
  { label: 'Top Parades', href: 'https://www.dropbox.com/home/Ag%C3%A8ncia%20Guinew/TOPS%20PARADAS', color: '#00c27c' },
  { label: 'Top Gols', href: 'https://www.dropbox.com/home/Ag%C3%A8ncia%20Guinew/TOPS%20GOLES', color: '#f5a623' },
  { label: 'Fotos 25/26', href: 'https://www.dropbox.com/home/Ag%C3%A8ncia%20Guinew/FOTOS%20Liga%20NEXUS%20ENERG%C3%8DA%20ASOBAL%202526', color: '#7c6fe0' },
  { label: 'Fotos 26/27', href: 'https://www.dropbox.com/scl/fo/vum2fm4qetsk7e1apqc61/ADxnzPy_Qsz4efSe2ZAdGEI?rlkey=j3d9dyd8jyre0abrlm9q4rgnj&st=ymylocas&e=2&dl=0', color: '#7c6fe0' },
  { label: 'Sessió Fotos Oficial 26/27', href: 'https://www.dropbox.com/scl/fo/ut5zxngf6u93friwdck3n/AAn43VXDTG8tJGa4ThtWXX0?rlkey=clq5fperiduilo8fja206d3xq&e=1&dl=0', color: '#7c6fe0' },
]

interface Action {
  id: string
  type: 'aturada' | 'gol'
  equip: string
  jugador: string
  top5: boolean
  minut: string
}

type MatchKey = string
type StoreData = Record<MatchKey, Action[]>

const STORE_KEY = 'asobal-j2627'

function loadStore(): StoreData {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') } catch { return {} }
}
function saveStore(d: StoreData) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(d)) } catch {}
}

export function AsobalContent() {
  const [selectedJ, setSelectedJ] = useState(() => {
    const today = new Date()
    let best = 0, bestDiff = Infinity
    CALENDAR.forEach((j, i) => {
      const [d, m, y] = j.date.split('/')
      const jDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
      const diff = Math.abs(jDate.getTime() - today.getTime())
      if (diff < bestDiff) { best = i; bestDiff = diff }
    })
    return best
  })
  const [openMatches, setOpenMatches] = useState<Set<string>>(new Set())
  const [store, setStore] = useState<StoreData>({})
  const [addingFor, setAddingFor] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ type: 'gol' as 'aturada' | 'gol', equip: '', jugador: '', minut: '', top5: false })

  useEffect(() => { setStore(loadStore()) }, [])

  const toggleMatch = (key: string) => {
    setOpenMatches(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const addAction = useCallback((key: string) => {
    if (!form.jugador.trim()) return
    if (editingId) {
      const next = { ...store, [key]: (store[key] ?? []).map(a => a.id === editingId ? { ...a, type: form.type, equip: form.equip, jugador: form.jugador.trim(), minut: form.minut, top5: form.top5 } : a) }
      setStore(next)
      saveStore(next)
    } else {
      const action: Action = {
        id: Date.now().toString(),
        type: form.type,
        equip: form.equip,
        jugador: form.jugador.trim(),
        minut: form.minut,
        top5: form.top5,
      }
      const next = { ...store, [key]: [...(store[key] ?? []), action] }
      setStore(next)
      saveStore(next)
    }
    setForm({ type: 'gol', equip: '', jugador: '', minut: '', top5: false })
    setEditingId(null)
    setAddingFor(null)
  }, [form, store, editingId])

  const deleteAction = useCallback((key: string, id: string) => {
    const next = { ...store, [key]: (store[key] ?? []).filter(a => a.id !== id) }
    setStore(next)
    saveStore(next)
  }, [store])

  const jornada = CALENDAR[selectedJ]

  const jornadaStats = (ji: number) => {
    let aturades = 0, gols = 0, top5 = 0
    for (let m = 0; m < 8; m++) {
      const actions = store[`j${ji}_m${m}`] ?? []
      aturades += actions.filter(a => a.type === 'aturada').length
      gols += actions.filter(a => a.type === 'gol').length
      top5 += actions.filter(a => a.top5).length
    }
    return { aturades, gols, top5 }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <style>{`
        .asb-j-item { padding:8px 12px; border-radius:8px; cursor:pointer; transition:background .15s; display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .asb-j-item:hover { background:rgba(0,0,0,0.04); }
        .asb-j-item.active { background:rgba(27,59,218,0.07); border-left:2px solid #1b3bda; padding-left:10px; }
        .asb-match-card { background:#fff; border:1px solid rgba(0,0,0,0.07); border-radius:10px; margin-bottom:8px; box-shadow:0 1px 3px rgba(0,0,0,0.05); position:relative; }
        .asb-match-header { padding:10px 14px; display:flex; align-items:center; gap:10px; cursor:pointer; }
        .asb-match-header:hover { background:rgba(0,0,0,0.02); }
        .asb-action-row { display:flex; align-items:center; gap:8px; padding:6px 14px; border-top:1px solid rgba(0,0,0,0.05); flex-wrap:wrap; }
        .asb-action-row:hover { background:rgba(0,0,0,0.02); }
        .asb-badge { font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px; letter-spacing:.04em; }
        .asb-aturada { background:rgba(27,59,218,0.1); color:#1b3bda; }
        .asb-gol { background:rgba(245,166,35,0.15); color:#d48a00; }
        .asb-top5 { background:rgba(22,163,74,0.1); color:#16a34a; }
        .asb-btn { border:none; border-radius:7px; cursor:pointer; font-family:inherit; font-weight:600; font-size:12px; padding:5px 12px; transition:opacity .15s; }
        .asb-btn:hover { opacity:.8; }
        .asb-input { background:#fff; border:1px solid rgba(0,0,0,0.12); border-radius:7px; color:#1a202c; font-family:inherit; font-size:12px; padding:5px 9px; outline:none; width:100%; }
        .asb-input:focus { border-color:rgba(27,59,218,0.5); }
        .asb-link { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:8px; background:#fff; border:1px solid rgba(0,0,0,0.08); text-decoration:none; transition:background .15s; flex:1; min-width:140px; box-shadow:0 1px 2px rgba(0,0,0,0.04); }
        .asb-link:hover { background:#f5f8ff; }
        .asb-links-grid { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; }
        .asb-type-btn { flex:1; padding:7px; border-radius:6px; border:1px solid rgba(0,0,0,0.1); background:#f5f5f5; color:#718096; font-family:inherit; font-size:18px; cursor:pointer; transition:all .15s; }
        .asb-type-btn.selected { border-color:#131ea6; background:linear-gradient(135deg,#1b3bda 0%,#131ea6 100%); color:#fff; }
        .asb-type-btn.gol-sel { border-color:#131ea6; background:linear-gradient(135deg,#1b3bda 0%,#131ea6 100%); color:#fff; }
        .asb-top5-cb { accent-color:#16a34a; width:14px; height:14px; cursor:pointer; }
        .asb-mobile-actions { display: none; }
        .asb-desktop-actions { display: block; }
        @media (max-width: 640px) {
          .asb-match-header { flex-wrap:wrap; gap:6px; }
          .asb-link { min-width:0; padding:10px 14px; flex:none; width:100%; box-sizing:border-box; font-size:13px !important; }
          .asb-links-grid { display:grid; grid-template-columns:1fr; gap:7px; justify-content:unset; }
          .asb-links-header { font-size:13px !important; font-weight:800 !important; color:#1a202c !important; letter-spacing:.05em !important; }
          .asb-badge { font-size:9px; padding:2px 5px; }
          .asb-jornada-header { flex-wrap:wrap; gap:6px; justify-content:center; }
          .asb-mobile-actions { display: block; }
          .asb-desktop-actions { display: none; }
        }
      `}</style>

      {/* TOP: Quick links */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: '#F8F8F8', flexShrink: 0 }}>
        <div className="asb-links-header" style={{ fontSize: 10, fontWeight: 700, color: '#9aa5b4', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link2 size={12} /> ASOBAL — Accés ràpid Dropbox
        </div>
        <div className="asb-links-grid">
          {LINKS.map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="asb-link">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#4a5568', fontWeight: 600 }}>{l.label}</span>
              <ExternalLink size={11} color="#9aa5b4" style={{ flexShrink: 0, marginLeft: 'auto' }} />
            </a>
          ))}
        </div>
      </div>

      {/* Jornada strip */}
      <div style={{ overflowX: 'auto', background: '#F0F2F5', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '6px 10px', display: 'flex', gap: 4, flexShrink: 0, justifyContent: 'flex-start' }}>
        {CALENDAR.map((_, ji) => {
          const { aturades, gols } = jornadaStats(ji)
          const hasData = aturades + gols > 0
          return (
            <button key={ji} onClick={() => { setSelectedJ(ji); setAddingFor(null) }}
              style={{ flexShrink: 0, padding: '3px 8px', borderRadius: 5, border: selectedJ === ji ? '1.5px solid #131ea6' : '1px solid rgba(0,0,0,0.1)', background: selectedJ === ji ? 'linear-gradient(135deg,#1b3bda 0%,#131ea6 100%)' : hasData ? 'rgba(245,166,35,0.07)' : '#fff', color: selectedJ === ji ? '#fff' : '#4a5568', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
              J{ji + 1}
              {hasData && <span style={{ position: 'absolute', top: -3, right: -3, width: 6, height: 6, borderRadius: '50%', background: '#f5a623', border: '1px solid #fff' }} />}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Jornada detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="asb-jornada-header" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, width: '100%', maxWidth: 900, justifyContent: 'center' }}>
            <Trophy size={16} color="#1b3bda" />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a202c' }}>Jornada {selectedJ + 1}</h2>
            <span style={{ fontSize: 12, color: '#9aa5b4' }}>{jornada.date}</span>
            {(() => {
              const { aturades, gols, top5 } = jornadaStats(selectedJ)
              return (aturades + gols > 0) ? (
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                  {aturades > 0 && <span className="asb-badge asb-aturada">{aturades} aturades</span>}
                  {gols > 0 && <span className="asb-badge asb-gol">{gols} gols</span>}
                  {top5 > 0 && <span className="asb-badge asb-top5">{top5} top5</span>}
                </div>
              ) : null
            })()}
          </div>

          <div style={{ width: '100%', maxWidth: 900 }}>
            {jornada.matches.map((match, mi) => {
              const key = `j${selectedJ}_m${mi}`
              const isOpen = openMatches.has(key)
              const actions = store[key] ?? []
              const isAdding = addingFor === key
              const aturades = actions.filter(a => a.type === 'aturada')
              const gols = actions.filter(a => a.type === 'gol')

              return (
                <div key={key} className="asb-match-card">
                  <div className="asb-match-header" onClick={() => toggleMatch(key)} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '10px 14px' }}>
                    {/* left: home badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      {aturades.filter(a => a.equip === match.home).length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(27,59,218,0.08)', borderRadius: 8, padding: '3px 8px 3px 5px' }}>
                          <span style={{ fontSize: 16 }}>🖐🏻</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#1b3bda', lineHeight: 1 }}>{aturades.filter(a => a.equip === match.home).length}</span>
                        </div>
                      )}
                      {gols.filter(a => a.equip === match.home).length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(245,166,35,0.12)', borderRadius: 8, padding: '3px 8px 3px 5px' }}>
                          <span style={{ fontSize: 16 }}>🏐</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#d48a00', lineHeight: 1 }}>{gols.filter(a => a.equip === match.home).length}</span>
                        </div>
                      )}
                    </div>
                    {/* center: logos */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
                      {[match.home, match.away].map((code, ci) => (
                        <span key={code} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          {ci === 1 && <span style={{ color: '#9aa5b4', fontWeight: 400, fontSize: 11 }}>vs</span>}
                          <span
                            onClick={e => {
                              e.stopPropagation()
                              setForm({ type: form.type, equip: code, jugador: '', minut: '', top5: false })
                              setAddingFor(key)
                              if (!openMatches.has(key)) toggleMatch(key)
                            }}
                            style={{ cursor: 'pointer', display: 'inline-block', borderRadius: 8, padding: 4, border: '2px solid', borderColor: isAdding && form.equip === code ? 'rgba(27,59,218,0.45)' : 'transparent', background: isAdding && form.equip === code ? 'rgba(27,59,218,0.06)' : 'transparent', transition: 'all .15s' }}
                            title={TEAMS[code]}
                          >
                            <TeamLogo code={code} size={52} />
                          </span>
                        </span>
                      ))}
                    </div>
                    {/* right: away badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      {actions.some(a => a.top5) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(22,163,74,0.1)', borderRadius: 8, padding: '3px 8px 3px 6px' }}>
                          <Star size={13} color="#16a34a" fill="#16a34a" />
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>Top5</span>
                        </div>
                      )}
                      {aturades.filter(a => a.equip === match.away).length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(27,59,218,0.08)', borderRadius: 8, padding: '3px 5px 3px 8px' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#1b3bda', lineHeight: 1 }}>{aturades.filter(a => a.equip === match.away).length}</span>
                          <span style={{ fontSize: 16 }}>🖐🏻</span>
                        </div>
                      )}
                      {gols.filter(a => a.equip === match.away).length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(245,166,35,0.12)', borderRadius: 8, padding: '3px 5px 3px 8px' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#d48a00', lineHeight: 1 }}>{gols.filter(a => a.equip === match.away).length}</span>
                          <span style={{ fontSize: 16 }}>🏐</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div>
                      {actions.length > 0 && (() => {
                        const sorted = [...actions].sort((a, b) => (parseInt(a.minut) || 999) - (parseInt(b.minut) || 999))
                        const actionBtn = (action: Action) => (
                          <div className="asb-action-cell" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', minHeight: 48 }}>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>{action.type === 'aturada' ? '🖐🏻' : '🏐'}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, color: '#1a202c', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.jugador}</div>
                              {action.minut && <div style={{ fontSize: 11, color: '#9aa5b4', marginTop: 1 }}>{action.minut}&apos;</div>}
                            </div>
                            {action.top5 && <Star size={12} color="#16a34a" fill="#16a34a" style={{ flexShrink: 0 }} />}
                            <div style={{ display: 'flex', flexShrink: 0 }}>
                              <button onClick={e => { e.stopPropagation(); setForm({ type: action.type, equip: action.equip, jugador: action.jugador, minut: action.minut, top5: action.top5 }); setEditingId(action.id); setAddingFor(key); if (!openMatches.has(key)) toggleMatch(key) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: '8px 9px', minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={14} /></button>
                              <button onClick={() => deleteAction(key, action.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fc8181', padding: '8px 9px', minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                            </div>
                          </div>
                        )
                        return (
                          <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            {/* Desktop: 2-column layout */}
                            <div className="asb-desktop-actions">
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <div className="asb-action-col-header" style={{ padding: '5px 10px', fontSize: 10, fontWeight: 800, color: '#1b3bda', letterSpacing: '.04em', textTransform: 'uppercase', background: 'rgba(27,59,218,0.04)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{TEAMS[match.home]}</div>
                                <div className="asb-action-col-header" style={{ padding: '5px 10px', fontSize: 10, fontWeight: 800, color: '#1b3bda', letterSpacing: '.04em', textTransform: 'uppercase', background: 'rgba(27,59,218,0.04)', borderLeft: '1px solid rgba(0,0,0,0.05)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{TEAMS[match.away]}</div>
                              </div>
                              {sorted.map(action => {
                                const isHome = action.equip === match.home
                                return (
                                  <div key={action.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                                    <div style={{ borderRight: '1px solid rgba(0,0,0,0.05)' }}>{isHome ? actionBtn(action) : null}</div>
                                    <div>{!isHome ? actionBtn(action) : null}</div>
                                  </div>
                                )
                              })}
                            </div>
                            {/* Mobile: full-width rows with team chip */}
                            <div className="asb-mobile-actions">
                              {sorted.map(action => {
                                const isHome = action.equip === match.home
                                return (
                                  <div key={action.id} style={{ borderTop: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', minHeight: 52 }}>
                                    <span style={{ fontSize: 18, flexShrink: 0 }}>{action.type === 'aturada' ? '🖐🏻' : '🏐'}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 13, color: '#1a202c', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.jugador}</div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                                        {action.minut && <span style={{ fontSize: 11, color: '#9aa5b4' }}>{action.minut}&apos;</span>}
                                        <span style={{ fontSize: 9, fontWeight: 700, color: isHome ? '#1b3bda' : '#d48a00', background: isHome ? 'rgba(27,59,218,0.08)' : 'rgba(245,166,35,0.12)', borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{TEAMS[action.equip] ?? action.equip}</span>
                                      </div>
                                    </div>
                                    {action.top5 && <Star size={12} color="#16a34a" fill="#16a34a" style={{ flexShrink: 0 }} />}
                                    <div style={{ display: 'flex', flexShrink: 0 }}>
                                      <button onClick={e => { e.stopPropagation(); setForm({ type: action.type, equip: action.equip, jugador: action.jugador, minut: action.minut, top5: action.top5 }); setEditingId(action.id); setAddingFor(key); if (!openMatches.has(key)) toggleMatch(key) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: '8px 10px', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={15} /></button>
                                      <button onClick={() => deleteAction(key, action.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fc8181', padding: '8px 10px', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={15} /></button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })()}

                      {isAdding ? (
                        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Gol esquerra · Aturada dreta */}
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className={`asb-type-btn${form.type === 'gol' ? ' gol-sel selected' : ''}`}
                              onClick={() => setForm(f => ({ ...f, type: 'gol' }))}
                            >
                              🏐
                            </button>
                            <button
                              className={`asb-type-btn${form.type === 'aturada' ? ' selected' : ''}`}
                              onClick={() => setForm(f => ({ ...f, type: 'aturada' }))}
                            >
                              🖐🏻
                            </button>
                          </div>
                          {/* Jugador + minut */}
                          <div style={{ display: 'flex', gap: 6 }}>
                            <PlayerSelect
                              players={form.equip ? (PLAYERS[form.equip] ?? []) : [...(PLAYERS[match.home] ?? []), ...(PLAYERS[match.away] ?? [])]}
                              value={form.jugador}
                              onChange={name => setForm(f => ({ ...f, jugador: name }))}
                              actionType={form.type}
                            />
                            <MinuteSelect
                              value={form.minut}
                              onChange={m => setForm(f => ({ ...f, minut: m }))}
                            />
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#718096' }}>
                            <input
                              type="checkbox"
                              className="asb-top5-cb"
                              checked={form.top5}
                              onChange={e => setForm(f => ({ ...f, top5: e.target.checked }))}
                            />
                            <Star size={12} color={form.top5 ? '#16a34a' : '#9aa5b4'} fill={form.top5 ? '#16a34a' : 'none'} />
                            Candidat Top 5 {form.type === 'aturada' ? 'Aturades' : 'Gols'}
                          </label>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="asb-btn"
                              style={{ background: 'linear-gradient(135deg,#1b3bda 0%,#131ea6 100%)', color: '#fff', border: 'none' }}
                              onClick={() => addAction(key)}
                            >
                              {editingId ? 'Actualitzar' : 'Guardar'}
                            </button>
                            <button
                              className="asb-btn"
                              style={{ background: '#f0f0f0', color: '#718096' }}
                              onClick={() => { setAddingFor(null); setEditingId(null); setForm(f => ({ ...f, type: 'gol', equip: '', jugador: '', minut: '', top5: false })) }}
                            >
                              Cancel·lar
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
