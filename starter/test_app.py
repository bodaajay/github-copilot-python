import pytest
from app import app 

@pytest.fixture 
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client 

def test_home_page(client):

    response = client.get('/')
    assert response.status_code == 200

def test_new_game_route(client):

    response = client.get('/new')
    assert response.status_code == 200
