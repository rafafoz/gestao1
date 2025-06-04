// Variáveis globais
let allEvents = [];
let filteredEvents = [];
let displayedEvents = 0;
const eventsPerPage = 5;

document.addEventListener('DOMContentLoaded', function() {
    // Carrega os dados do JSON
    fetch('../dados/dados-eventos.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar os dados dos eventos');
            }
            return response.json();
        })
        .then(data => {
            allEvents = filterAndSortEvents(data);
            filteredEvents = [...allEvents];
            displayNextEvents();
            setupFilters();
        })
        .catch(error => {
      console.error('Erro:', error);
      document.getElementById('events-container').innerHTML = `
        <div class="error-message p-4 text-center text-red-600">
          Não foi possível carregar os eventos. Por favor, tente novamente mais tarde.
        </div>
      `;
    });

    // Botão "Carregar mais"
    document.getElementById('load-more').addEventListener('click', displayNextEvents);
});

// Configura os filtros
function setupFilters() {
    // Filtro por nome
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Pesquisar por nome...';
    searchInput.className = 'search-input p-2 border rounded w-full mb-4';
    searchInput.addEventListener('input', (e) => {
        filterEvents({
            name: e.target.value.toLowerCase(),
            month: document.querySelector('.month-filter')?.value,
            type: document.querySelector('.type-filter')?.value
        });
    });

    // Filtro por mês
    const months = [...new Set(allEvents.map(event => event.Mes))];
    const monthFilter = document.createElement('select');
    monthFilter.className = 'month-filter p-2 border rounded w-full mb-4';
    monthFilter.innerHTML = `<option value="">Todos os meses</option>${
        months.map(month => `<option value="${month}">${month}</option>`).join('')
    }`;
    monthFilter.addEventListener('change', () => {
        filterEvents({
            name: document.querySelector('.search-input')?.value.toLowerCase(),
            month: monthFilter.value,
            type: document.querySelector('.type-filter')?.value
        });
    });

    // Filtro por tipo - AGORA ORDENADO ALFABETICAMENTE
    const types = [...new Set(allEvents.flatMap(event => event.Tipo?.split(', ') || []))];
    types.sort((a, b) => a.localeCompare(b)); // Ordenação alfabética
    
    const typeFilter = document.createElement('select');
    typeFilter.className = 'type-filter p-2 border rounded w-full mb-4';
    typeFilter.innerHTML = `<option value="">Todos os tipos</option>${
        types.map(type => `<option value="${type}">${type}</option>`).join('')
    }`;
    typeFilter.addEventListener('change', () => {
        filterEvents({
            name: document.querySelector('.search-input')?.value.toLowerCase(),
            month: document.querySelector('.month-filter')?.value,
            type: typeFilter.value
        });
    });


    // Insere os filtros no cabeçalho
    const header = document.querySelector('.card-header');
    header.appendChild(searchInput);
    header.appendChild(monthFilter);
    header.appendChild(typeFilter);
}

// Filtra os eventos com base nos critérios
function filterEvents({name, month, type}) {
    filteredEvents = allEvents.filter(event => {
        const nameMatch = !name || event.Evento.toLowerCase().includes(name);
        const monthMatch = !month || event.Mes === month;
        const typeMatch = !type || event.Tipo?.includes(type);
        return nameMatch && monthMatch && typeMatch;
    });

    // Reseta a exibição
    displayedEvents = 0;
    document.getElementById('events-container').innerHTML = '';
    document.getElementById('load-more').style.display = 'block';
    displayNextEvents();
}

// Função para filtrar e ordenar eventos
function filterAndSortEvents(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events
      .filter(event => {
          const eventStart = new Date(event.DataInicial);
          
          // Verifica se a DataFinal existe e não está vazia
          const hasDataFinal = event.DataFinal && event.DataFinal.trim() !== '';
          const eventEnd = hasDataFinal ? new Date(event.DataFinal) : null;
          
          // Se tem DataFinal válida, verifica se o evento ainda está ativo
          if (hasDataFinal) {
              return eventEnd >= today;
          }
          // Se não tem DataFinal, verifica apenas se a data inicial é hoje ou no futuro
          else {
              return eventStart >= today;
          }
      })
      .sort((a, b) => {
          return new Date(a.DataInicial) - new Date(b.DataInicial);
      });
}

// Atualiza displayNextEvents para usar filteredEvents
function displayNextEvents() {
    const eventsContainer = document.getElementById('events-container');
    const loadMoreBtn = document.getElementById('load-more');
    
    const remainingEvents = filteredEvents.length - displayedEvents;
    const eventsToShow = Math.min(eventsPerPage, remainingEvents);

    if (remainingEvents <= 0) {
        loadMoreBtn.style.display = 'none';
        if (filteredEvents.length === 0) {
            eventsContainer.innerHTML = `
                <div class="no-results p-4 text-center text-gray-500">
                    Nenhum evento encontrado com os critérios selecionados.
                </div>
            `;
        }
        return;
    }

    for (let i = 0; i < eventsToShow; i++) {
        const event = filteredEvents[displayedEvents + i];
        const eventElement = createEventElement(event);
        eventsContainer.appendChild(eventElement);
    }

    displayedEvents += eventsToShow;

    if (displayedEvents >= filteredEvents.length) {
        loadMoreBtn.style.display = 'none';
    }
}

// Função para criar o elemento do evento
function createEventElement(event) {
  const eventDate = new Date(event.DataInicial);
  const day = eventDate.getDate();
  const month = getMonthAbbreviation(eventDate.getMonth());
  
  const eventElement = document.createElement('article');
  eventElement.className = 'event-item';
  
  // Cria o link do endereço para o Google Maps
  const addressLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.Endereco)}`;
  
  // Cria a imagem ou placeholder
  const imageElement = event.Imagem 
    ? `<img src="${event.Imagem}" alt="Imagem do evento ${event.Evento}" class="event-image">`
    : `<div class="no-image"><i class="fas fa-calendar-alt"></i></div>`;
  
  // Cria o link do website se existir
  const websiteElement = event.Website 
    ? `<p class="event-website"><a href="${event.Website}" target="_blank">${event.Website}</a></p>`
    : '';
  
  eventElement.innerHTML = `
    <div class="event-date">
      <span class="day">${day}</span>
      <span class="month">${month}</span>
    </div>
    <div class="event-details">
      <h2>${event.Evento}</h2>
      <p class="event-period">${event.Periodo}</p>
      <p class="event-time">${event.Horario}</p>
      <p class="event-location">${event.Espaco}</p>
      <p class="event-endereco"><a href="${addressLink}" target="_blank">${event.Endereco}</a></p>
      ${websiteElement}
    </div>
    ${imageElement}
  `;
  
  return eventElement;
}

// Função auxiliar para obter abreviação do mês
function getMonthAbbreviation(monthIndex) {
  const months = [
    'jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.',
    'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'
  ];
  return months[monthIndex];
}

// Função para formatar o horário
function formatTime(timeString) {
  if (!timeString) return '';
  
  // Verifica se já está no formato desejado
  if (timeString.includes('às')) {
    return timeString.replace('às', '–');
  }
  
  // Tenta formatar se for um horário ISO
  try {
    const [start, end] = timeString.split(' às ');
    return `${start} – ${end}`;
  } catch {
    return timeString;
  }
}